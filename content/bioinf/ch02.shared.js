// Shared helpers for bioinf chapter 2 (pairwise alignment). Real data: UniProt sequences, NCBI BLOSUM62/PAM250.
export const AA = 'ARNDCQEGHILKMFPSTWYV';
const parseMat = (t) => t.trim().split("\n").map((r) => r.trim().split(/\s+/).map(Number));
export const B62 = parseMat(`4 -1 -2 -2 0 -1 -1 0 -2 -1 -1 -1 -1 -2 -1 1 0 -3 -2 0
-1 5 0 -2 -3 1 0 -2 0 -3 -2 2 -1 -3 -2 -1 -1 -3 -2 -3
-2 0 6 1 -3 0 0 0 1 -3 -3 0 -2 -3 -2 1 0 -4 -2 -3
-2 -2 1 6 -3 0 2 -1 -1 -3 -4 -1 -3 -3 -1 0 -1 -4 -3 -3
0 -3 -3 -3 9 -3 -4 -3 -3 -1 -1 -3 -1 -2 -3 -1 -1 -2 -2 -1
-1 1 0 0 -3 5 2 -2 0 -3 -2 1 0 -3 -1 0 -1 -2 -1 -2
-1 0 0 2 -4 2 5 -2 0 -3 -3 1 -2 -3 -1 0 -1 -3 -2 -2
0 -2 0 -1 -3 -2 -2 6 -2 -4 -4 -2 -3 -3 -2 0 -2 -2 -3 -3
-2 0 1 -1 -3 0 0 -2 8 -3 -3 -1 -2 -1 -2 -1 -2 -2 2 -3
-1 -3 -3 -3 -1 -3 -3 -4 -3 4 2 -3 1 0 -3 -2 -1 -3 -1 3
-1 -2 -3 -4 -1 -2 -3 -4 -3 2 4 -2 2 0 -3 -2 -1 -2 -1 1
-1 2 0 -1 -3 1 1 -2 -1 -3 -2 5 -1 -3 -1 0 -1 -3 -2 -2
-1 -1 -2 -3 -1 0 -2 -3 -2 1 2 -1 5 0 -2 -1 -1 -1 -1 1
-2 -3 -3 -3 -2 -3 -3 -3 -1 0 0 -3 0 6 -4 -2 -2 1 3 -1
-1 -2 -2 -1 -3 -1 -1 -2 -2 -3 -3 -1 -2 -4 7 -1 -1 -4 -3 -2
1 -1 1 0 -1 0 0 0 -1 -2 -2 0 -1 -2 -1 4 1 -3 -2 -2
0 -1 0 -1 -1 -1 -1 -2 -2 -1 -1 -1 -1 -2 -1 1 5 -2 -2 0
-3 -3 -4 -4 -2 -2 -3 -2 -2 -3 -2 -3 -1 1 -4 -3 -2 11 2 -3
-2 -2 -2 -3 -2 -1 -2 -3 2 -1 -1 -2 -1 3 -3 -2 -2 2 7 -1
0 -3 -3 -3 -1 -2 -2 -3 -3 3 1 -2 1 -1 -2 -2 0 -3 -1 4`);
export const PAM250 = parseMat(`2 -2 0 0 -2 0 0 1 -1 -1 -2 -1 -1 -3 1 1 1 -6 -3 0
-2 6 0 -1 -4 1 -1 -3 2 -2 -3 3 0 -4 0 0 -1 2 -4 -2
0 0 2 2 -4 1 1 0 2 -2 -3 1 -2 -3 0 1 0 -4 -2 -2
0 -1 2 4 -5 2 3 1 1 -2 -4 0 -3 -6 -1 0 0 -7 -4 -2
-2 -4 -4 -5 12 -5 -5 -3 -3 -2 -6 -5 -5 -4 -3 0 -2 -8 0 -2
0 1 1 2 -5 4 2 -1 3 -2 -2 1 -1 -5 0 -1 -1 -5 -4 -2
0 -1 1 3 -5 2 4 0 1 -2 -3 0 -2 -5 -1 0 0 -7 -4 -2
1 -3 0 1 -3 -1 0 5 -2 -3 -4 -2 -3 -5 0 1 0 -7 -5 -1
-1 2 2 1 -3 3 1 -2 6 -2 -2 0 -2 -2 0 -1 -1 -3 0 -2
-1 -2 -2 -2 -2 -2 -2 -3 -2 5 2 -2 2 1 -2 -1 0 -5 -1 4
-2 -3 -3 -4 -6 -2 -3 -4 -2 2 6 -3 4 2 -3 -3 -2 -2 -1 2
-1 3 1 0 -5 1 0 -2 0 -2 -3 5 0 -5 -1 0 0 -3 -4 -2
-1 0 -2 -3 -5 -1 -2 -3 -2 2 4 0 6 0 -2 -2 -1 -4 -2 2
-3 -4 -3 -6 -4 -5 -5 -5 -2 1 2 -5 0 9 -5 -3 -3 0 7 -1
1 0 0 -1 -3 0 -1 0 0 -2 -3 -1 -2 -5 6 1 0 -6 -5 -1
1 0 1 0 0 -1 0 1 -1 -1 -3 0 -2 -3 1 2 1 -2 -3 -1
1 -1 0 0 -2 -1 0 0 -1 0 -2 0 -1 -3 0 1 3 -5 -3 0
-6 2 -4 -7 -8 -5 -7 -7 -3 -5 -2 -3 -4 0 -6 -2 -5 17 0 -6
-3 -4 -2 -4 0 -4 -4 -5 0 -1 -1 -4 -2 7 -5 -3 -3 0 10 -2
0 -2 -2 -2 -2 -2 -2 -1 -2 4 2 -2 2 -1 -1 -1 0 -6 -2 4`);
export const PROT = {
  HBA_HUMAN: { acc: 'P69905', name: "Hemoglobin subunit alpha (Homo sapiens)", seq: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
  HBB_HUMAN: { acc: 'P68871', name: "Hemoglobin subunit beta (Homo sapiens)", seq: 'MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH' },
  MYG_HUMAN: { acc: 'P02144', name: "Myoglobin (Homo sapiens)", seq: 'MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDMASNYKELGFQG' },
  HBA_HORSE: { acc: 'P01958', name: "Hemoglobin subunit alpha (Equus caballus)", seq: 'MVLSAADKTNVKAAWSKVGGHAGEYGAEALERMFLGFPTTKTYFPHFDLSHGSAQVKAHGKKVGDALTLAVGHLDDLPGALSNLSDLHAHKLRVDPVNFKLLSHCLLSTLAVHLPNDFTPAVHASLDKFLSSVSTVLTSKYR' },
  HBB_HORSE: { acc: 'P02062', name: "Hemoglobin subunit beta (Equus caballus)", seq: 'VQLSGEEKAAVLALWDKVNEEEVGGEALGRLLVVYPWTQRFFDSFGDLSNPGAVMGNPKVKAHGKKVLHSFGEGVHHLDNLKGTFAALSELHCDKLHVDPENFRLLGNVLVVVLARHFGKDFTPELQASYQKVVAGVANALAHKYH' },
  HBA_CHICK: { acc: 'P01994', name: "Hemoglobin subunit alpha-A (Gallus gallus)", seq: 'MVLSAADKNNVKGIFTKIAGHAEEYGAETLERMFTTYPPTKTYFPHFDLSHGSAQIKGHGKKVVAALIEAANHIDDIAGTLSKLSDLHAHKLRVDPVNFKLLGQCFLVVVAIHHPAALTPEVHASLDKFLCAVGTVLTAKYR' },
  HBB_CHICK: { acc: 'P02112', name: "Hemoglobin subunit beta (Gallus gallus)", seq: 'MVHWTAEEKQLITGLWGKVNVAECGAEALARLLIVYPWTQRFFASFGNLSSPTAILGNPMVRAHGKKVLTSFGDAVKNLDNIKNTFSQLSELHCDKLHVDPENFRLLGDILIIVLAAHFSKDFTPECQAAWQKLVRVVAHALARKYH' },
  MYG_PHYMC: { acc: 'P02185', name: "Myoglobin (Physeter macrocephalus)", seq: 'MVLSEGEWQLVLHVWAKVEADVAGHGQDILIRLFKSHPETLEKFDRFKHLKTEAEMKASEDLKKHGVTVLTALGAILKKKGHHEAELKPLAQSHATKHKIPIKYLEFISEAIIHVLHSRHPGDFGADAQGAMNKALELFRKDIAAKYKELGYQG' },
  LGB4_SOYBN: { acc: 'P02236', name: "Leghemoglobin 4 (Glycine max)", seq: 'MGAFTEKQEALVSSSFEAFKANIPQYSVVFYTSILEKAPAAKDLFSFLSNGVDPSNPKLTGHAEKLFGLVRDSAGQLKANGTVVADAALGSIHAQKAITDPQFVVVKEALLKTIKEAVGDKWSDELSSAWEVAYDELAAAIKKAF' },
  BAHG_VITST: { acc: 'P04252', name: "Bacterial hemoglobin (Vitreoscilla stercoraria)", seq: 'MLDQQTINIIKATVPVLKEHGVTITTTFYKNLFAKHPEVRPLFDMGRQESLEQPKALAMTVLAAAQNIENLPAILPAVKKIAVKHCQAGVAAAHYPIVGQELLGAIKEVLGDAATDDILDAWGKAYGVIADVFIQVEADLYAQAVE' },
  GLB5_PETMA: { acc: 'P02208', name: "Globin-5 (Petromyzon marinus)", seq: 'MPIVDTGSVAPLSAAEKTKIRSAWAPVYSTYETSGVDILVKFFTSTPAAQEFFPKFKGLTTADQLKKSADVRWHAERIINAVNDAVASMDDTEKMSMKLRDLSGKHAKSFQVDPQYFKVLAAVIADTVAAGDAGFEKLMSMICILLRSAY' },
  NGB_HUMAN: { acc: 'Q9NPG2', name: "Neuroglobin (Homo sapiens)", seq: 'MERPEPELIRQSWRAVSRSPLEHGTVLFARLFALEPDLLPLFQYNCRQFSSPEDCLSSPEFLDHIRKVMLVIDAAVTNVEDLSSLEEYLASLGRKHRAVGVKLSSFSTVGESLLYMLEKCLGPAFTPATRAAWSQLYGAVVQAMSRGWDGE' },
  CYGB_HUMAN: { acc: 'Q8WWM9', name: "Cytoglobin (Homo sapiens)", seq: 'MEKVPGEMEIERRERSEELSEAERKAVQAMWARLYANCEDVGVAILVRFFVNFPSAKQYFSQFKHMEDPLEMERSPQLRKHACRVMGALNTVVENLHDPDKVSSVLALVGKAHALKHKVEPVYFKILSGVILEVVAEEFASDFPPETQRAWAKLRGLIYSHVTAAYKEVGWVQQVPNATTPPATLPSSGP' },
  CYC_HUMAN: { acc: 'P99999', name: "Cytochrome c (Homo sapiens)", seq: 'MGDVEKGKKIFIMKCSQCHTVEKGGKHKTGPNLHGLFGRKTGQAPGYSYTAANKNKGIIWGEDTLMEYLENPKKYIPGTKMIFVGIKKKEERADLIAYLKKATNE' },
  CYC_HORSE: { acc: 'P00004', name: "Cytochrome c (Equus caballus)", seq: 'MGDVEKGKKIFVQKCAQCHTVEKGGKHKTGPNLHGLFGRKTGQAPGFTYTDANKNKGITWKEETLMEYLENPKKYIPGTKMIFAGIKKKTEREDLIAYLKKATNE' },
  CYC1_YEAST: { acc: 'P00044', name: "Cytochrome c isoform 1 (Saccharomyces cerevisiae)", seq: 'MTEFKAGSAKKGATLFKTRCLQCHTVEKGGPHKVGPNLHGIFGRHSGQAEGYSYTDANIKKNVLWDENNMSEYLTNPKKYIPGTKMAFGGLKKEKDRNDLITYLKKACE' },
  LYSC_CHICK: { acc: 'P00698', name: "Lysozyme C (Gallus gallus)", seq: 'MRSLLILVLCFLPLAALGKVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL' },
  LYSC_HUMAN: { acc: 'P61626', name: "Lysozyme C (Homo sapiens)", seq: 'MKALIVLGLVLLSVTVQGKVFERCELARTLKRLGMDGYRGISLANWMCLAKWESGYNTRATNYNAGDRSTDYGIFQINSRYWCNDGKTPGAVNACHLSCSALLQDNIADAVACAKRVVRDPQGIRAWVAWRNRCQNRDVRQYVQGCGV' },
  LALBA_HUMAN: { acc: 'P00709', name: "Alpha-lactalbumin (Homo sapiens)", seq: 'MRFFVPLFLVGILFPAILAKQFTKCELSQLLKDIDGYGGIALPELICTMFHTSGYDTQAIVENNESTEYGLFQISNKLWCKSSQVPQSRNICDISCDKFLDDDITDDIMCAKKILDIKGIDYWLAHKALCTEKLEQWLCEKL' },
  LALBA_BOVIN: { acc: 'P00711', name: "Alpha-lactalbumin (Bos taurus)", seq: 'MMSFVSLLLVGILFHATQAEQLTKCEVFRELKDLKGYGGVSLPEWVCTTFHTSGYDTQAIVQNNDSTEYGLFQINNKIWCKDDQNPHSSNICNISCDKFLDDDLTDDIMCVKKILDKVGINYWLAHKALCSEKLDQWLCEKL' },
  TRY1_BOVIN: { acc: 'P00760', name: "Serine protease 1 (Bos taurus)", seq: 'MKTFIFLALLGAAVAFPVDDDDKIVGGYTCGANTVPYQVSLNSGYHFCGGSLINSQWVVSAAHCYKSGIQVRLGEDNINVVEGNEQFISASKSIVHPSYNSNTLNNDIMLIKLKSAASLNSRVASISLPTSCASAGTQCLISGWGNTKSSGTSYPDVLKCLKAPILSDSSCKSAYPGQITSNMFCAGYLEGGKDSCQGDSGGPVVCSGKLQGIVSWGSGCAQKNKPGVYTKVCNYVSWIKQTIASN' },
  CTRA_BOVIN: { acc: 'P00766', name: "Chymotrypsinogen A (Bos taurus)", seq: 'CGVPAIQPVLSGLSRIVNGEEAVPGSWPWQVSLQDKTGFHFCGGSLINENWVVTAAHCGVTTSDVVVAGEFDQGSSSEKIQKLKIAKVFKNSKYNSLTINNDITLLKLSTAASFSQTVSAVCLPSASDDFAAGTTCVTTGWGLTRYTNANTPDRLQQASLPLLSNTNCKKYWGTKIKDAMICAGASGVSSCMGDSGGPLVCKKNGAWTLVGIVSWGSSTCSTSTPGVYARVTALVNWVQQTLAAN' },
  ELNE_HUMAN: { acc: 'P08246', name: "Neutrophil elastase (Homo sapiens)", seq: 'MTLGRRLACLFLACVLPALLLGGTALASEIVGGRRARPHAWPFMVSLQLRGGHFCGATLIAPNFVMSAAHCVANVNVRAVRVVLGAHNLSRREPTRQVFAVQRIFENGYDPVNLLNDIVILQLNGSATINANVQVAQLPAQGRRLGNGVQCLAMGWGLLGRNRGIASVLQELNVTVVTSLCRRSNVCTLVRGRQAGVCFGDSGSPLVCNGLIHGIASFVRGGCASGLYPDAFAPVAQFVNWIDSIIQRSEDNPCPHPRDPDPASRTH' },
  THIO_ECOLI: { acc: 'P0AA25', name: "Thioredoxin 1 (Escherichia coli)", seq: 'MSDKIIHLTDDSFDTDVLKADGAILVDFWAEWCGPCKMIAPILDEIADEYQGKLTVAKLNIDQNPGTAPKYGIRGIPTLLLFKNGEVAATKVGALSKGQLKEFLDANLA' },
  THIO_HUMAN: { acc: 'P10599', name: "Thioredoxin (Homo sapiens)", seq: 'MVKQIESKTAFQEALDAAGDKLVVVDFSATWCGPCKMIKPFFHSLSEKYSNVIFLEVDVDDCQDVASECEVKCMPTFQFFKKGQKVGEFSGANKEKLEATINELV' },
};

// ───────────────────────────────────────────────────────────── scoring
const AAI = {}; for (let i = 0; i < AA.length; i++) AAI[AA[i]] = i;
export const aaIndex = (c) => AAI[c];
export function scoreFn(kind, match = 1, mismatch = -1) {
  if (kind === 'blosum62') return (a, b) => (AAI[a] === undefined || AAI[b] === undefined ? -4 : B62[AAI[a]][AAI[b]]);
  if (kind === 'pam250') return (a, b) => (AAI[a] === undefined || AAI[b] === undefined ? -8 : PAM250[AAI[a]][AAI[b]]);
  return (a, b) => (a === b ? match : mismatch);
}

// ───────────────────────────────────────────────────────────── the general aligner (Gotoh, all variants)
// Rows index s, columns index t. A gap of length k costs go + (k-1)·ge (linear gaps: go = ge).
// o = { score(a,b), go, ge, local, free: {top, left, bottom, right} }
//   free.top    : H[0][j] = 0   (t may start anywhere)       free.left   : H[i][0] = 0 (s may start anywhere)
//   free.bottom : end anywhere in the last row (t may end anywhere) ; free.right: end anywhere in the last column
// States: M = s_i aligned to t_j, X = s_i against a gap (down), Y = t_j against a gap (right).
const NEG = -1e9;
export function align(s, t, o) {
  const n = s.length, m = t.length, go = o.go, ge = o.ge, local = !!o.local, fr = o.free || {};
  const mk = () => Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(NEG));
  const M = mk(), X = mk(), Y = mk(), H = mk();
  const bd = o.band, inB = (i, j) => !bd || (j - i >= bd[0] && j - i <= bd[1]);
  M[0][0] = 0;
  for (let j = 1; j <= m; j++) if (inB(0, j)) { if (fr.top || local) M[0][j] = 0; else Y[0][j] = -(go + ge * (j - 1)); }
  for (let i = 1; i <= n; i++) if (inB(i, 0)) { if (fr.left || local) M[i][0] = 0; else X[i][0] = -(go + ge * (i - 1)); }
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    if (!inB(i, j)) continue;
    if (i > 0 && j > 0) {
      const d = Math.max(M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]);
      let v = d + o.score(s[i - 1], t[j - 1]);
      if (local && v < 0) v = 0;
      M[i][j] = v;
    }
    if (i > 0) X[i][j] = Math.max(M[i - 1][j] - go, X[i - 1][j] - ge, Y[i - 1][j] - go, X[i][j]);
    if (j > 0) Y[i][j] = Math.max(M[i][j - 1] - go, Y[i][j - 1] - ge, X[i][j - 1] - go, Y[i][j]);
    H[i][j] = Math.max(M[i][j], X[i][j], Y[i][j]);
  }
  // end cell
  let bi = n, bj = m, best = H[n][m], bs = null;
  const cand = (i, j) => { if (H[i][j] > best || (H[i][j] === best && bs === null)) { best = H[i][j]; bi = i; bj = j; } };
  if (local) { best = -Infinity; for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) if (M[i][j] > best) { best = M[i][j]; bi = i; bj = j; } }
  else if (fr.bottom || fr.right) {
    best = -Infinity;
    if (fr.bottom) for (let j = 0; j <= m; j++) if (H[n][j] > best) { best = H[n][j]; bi = n; bj = j; }
    if (fr.right) for (let i = 0; i <= n; i++) if (H[i][m] > best) { best = H[i][m]; bi = i; bj = m; }
  }
  // traceback (prefers diagonal)
  let i = bi, j = bj;
  let st = local ? 'M' : (M[i][j] === H[i][j] ? 'M' : X[i][j] === H[i][j] ? 'X' : 'Y');
  const ops = [], path = [[i, j]];
  let guard = 0;
  while (guard++ < n + m + 5) {
    if (st === 'M') {
      if (i === 0 || j === 0) break;
      if (local && M[i][j] === 0) break;
      const sc = o.score(s[i - 1], t[j - 1]), want = M[i][j] - sc;
      ops.push('D'); i--; j--; path.push([i, j]);
      if (M[i][j] === want && !(i === 0 && j === 0 && false)) st = 'M';
      else if (X[i][j] === want) st = 'X'; else if (Y[i][j] === want) st = 'Y'; else st = 'M';
      if (M[i][j] === want) st = 'M';
      if (i === 0 && j === 0) break;
      if (!local && st === 'M' && (i === 0 || j === 0) && M[i][j] !== want) break;
    } else if (st === 'X') {
      ops.push('V'); const v = X[i][j]; i--; path.push([i, j]);
      if (X[i][j] - ge === v && X[i][j] > NEG / 2) st = 'X';
      else if (M[i][j] - go === v) st = 'M'; else st = 'Y';
      if (i === 0 && j === 0) break;
    } else {
      ops.push('H'); const v = Y[i][j]; j--; path.push([i, j]);
      if (Y[i][j] - ge === v && Y[i][j] > NEG / 2) st = 'Y';
      else if (M[i][j] - go === v) st = 'M'; else st = 'X';
      if (i === 0 && j === 0) break;
    }
    if (st === 'M' && (i === 0 || j === 0) && (fr.top && i === 0 || fr.left && j === 0 || local)) break;
  }
  ops.reverse(); path.reverse();
  const si = path[0][0], sj = path[0][1];
  let a = '', b = '', k1 = si, k2 = sj, ident = 0, gaps = 0, gapOpens = 0, prev = '';
  for (const op of ops) {
    if (op === 'D') { a += s[k1]; b += t[k2]; if (s[k1] === t[k2]) ident++; k1++; k2++; }
    else if (op === 'V') { a += s[k1++]; b += '-'; gaps++; if (prev !== 'V') gapOpens++; }
    else { a += '-'; b += t[k2++]; gaps++; if (prev !== 'H') gapOpens++; }
    prev = op;
  }
  return { n, m, M, X, Y, H, score: best, end: [bi, bj], start: [si, sj], ops, path, top: a, bot: b, len: ops.length, ident, gaps, gapOpens, s, t, o };
}

// score of an alignment given as two gapped strings (for checking)
export function alnScore(a, b, o) {
  let sc = 0, g = 0;
  for (let k = 0; k < a.length; k++) {
    if (a[k] === '-' || b[k] === '-') { const t = a[k] === '-' ? 'H' : 'V'; sc -= (g === t ? o.ge : o.go); g = t; } else { sc += o.score(a[k], b[k]); g = 0; }
  }
  return sc;
}

// predecessor arrows of a linear-gap table, for drawing: [[di,dj],…] with di,dj in {-1,0}
export function linPtrs(r, i, j) {
  const { H, o } = r, out = [];
  if (i > 0 && j > 0 && H[i][j] === H[i - 1][j - 1] + o.score(r.s[i - 1], r.t[j - 1])) out.push([-1, -1]);
  if (i > 0 && H[i][j] === H[i - 1][j] - o.go) out.push([-1, 0]);
  if (j > 0 && H[i][j] === H[i][j - 1] - o.go) out.push([0, -1]);
  return out;
}

// ───────────────────────────────────────────────────────────── helpers for drawing
export const fmtN = (x) => (x <= NEG / 2 ? '−∞' : String(x).replace('-', '−'));
export function cleanSeq(txt, alphabet, maxLen = 400) {
  return String(txt || '').toUpperCase().replace(new RegExp(`[^${alphabet}]`, 'g'), '').slice(0, maxLen);
}
export const isAA = (c) => AAI[c] !== undefined;

// Alignment as three rows of tiles on a stage (axes: false). aln = {top, bot}, optional offsets for context.
// colour: identical green, similar (score > 0) teal, other mismatch red, gap orange.
export function drawAln(s, aln, score, o = {}) {
  const W = s.width, Hh = s.height, unit0 = o.unit || 24;
  const per = Math.max(8, Math.min(o.per || 80, Math.floor((W - 70) / unit0)));
  const x0 = -2.6, x1 = per + 0.6, unit = W / (x1 - x0), yspan = Hh / unit;
  const rowsAllowed = Math.max(1, Math.floor((yspan - 0.6) / 3.6));
  const Lall = aln.top.length, L = Math.min(Lall, per * rowsAllowed), rows = Math.max(1, Math.ceil(L / per));
  const lab = o.labels || ['', ''];
  s.setView([x0, x1], [1.4 - yspan, 1.4]);
  for (let r = 0; r < rows; r++) {
    const y0 = -r * 3.6;
    for (let c = 0; c < per && r * per + c < L; c++) {
      const k = r * per + c, a = aln.top[k], b = aln.bot[k], x = c;
      const gap = a === '-' || b === '-', same = !gap && a === b, sim = !gap && !same && score(a, b) > 0;
      const col = gap ? 'orange' : same ? 'green' : sim ? 'teal' : 'red';
      s.rect(x + 0.04, y0 - 0.08, x + 0.96, y0 + 0.92, { fill: a === '-' ? 'orange' : 'accent', fillAlpha: a === '-' ? 0.08 : 0.12, color: a === '-' ? 'orange' : 'accent', width: 1 });
      s.rect(x + 0.04, y0 - 2.08, x + 0.96, y0 - 1.08, { fill: b === '-' ? 'orange' : 'accent', fillAlpha: b === '-' ? 0.08 : 0.12, color: b === '-' ? 'orange' : 'accent', width: 1 });
      s.text(a, x + 0.5, y0 + 0.42, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: a === '-' ? 'orange' : 'ink' });
      s.text(b, x + 0.5, y0 - 1.58, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: b === '-' ? 'orange' : 'ink' });
      s.text(gap ? '' : same ? '|' : sim ? ':' : '·', x + 0.5, y0 - 0.58, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: col });
    }
  }
  s.text(lab[0], -0.2, 0.42, { align: 'right', baseline: 'middle', size: 12, color: 'muted' });
  s.text(lab[1], -0.2, -1.58, { align: 'right', baseline: 'middle', size: 12, color: 'muted' });
  if (L < Lall) s.text(`… ${Lall - L} more columns not drawn`, per, -rows * 3.6 + 0.9, { align: 'right', size: 12, color: 'muted' });
}

// DP table helper on the table kit
export function dpTable(v, st, opt = {}) {
  return v.table(st, { rows: 2, cols: 2, square: false, cellAspect: opt.cellAspect || 0.85, maxCell: opt.maxCell || 40, minCell: 12, size: opt.size || 13, ...opt });
}

// aligned strings from an op list (D diagonal, V down = s residue against a gap, H right = t residue against a gap)
export function opsToAln(s, t, ops, start = [0, 0]) {
  let a = '', b = '', i = start[0], j = start[1];
  for (const op of ops) {
    if (op === 'D') { a += s[i++]; b += t[j++]; } else if (op === 'V') { a += s[i++]; b += '-'; } else { a += '-'; b += t[j++]; }
  }
  return { top: a, bot: b };
}
export function countsOf(aln) {
  let ident = 0, gaps = 0, opens = 0, pa = '', pb = '';
  for (let k = 0; k < aln.top.length; k++) {
    const a = aln.top[k], b = aln.bot[k];
    if (a === '-' || b === '-') { gaps++; if (!(a === pa && b === pb)) opens++; } else if (a === b) ident++;
    pa = a === '-' ? '-' : 'x'; pb = b === '-' ? '-' : 'x';
  }
  return { ident, gaps, opens, len: aln.top.length };
}
// number of monotone lattice paths with diagonal steps (Delannoy number)
export function delannoy(m, n) {
  let prev = Array(n + 1).fill(1);
  for (let i = 1; i <= m; i++) { const cur = [1]; for (let j = 1; j <= n; j++) cur[j] = cur[j - 1] + prev[j] + prev[j - 1]; prev = cur; }
  return prev[n];
}
// DP matrix as a heat picture: rows = s (down), columns = t (right); cells of value NEG stay blank.
// st must have x: [0, m+1] and y: [-(n+1), 0]; lo/hi give the colour scale.
export function drawDPRaster(v, st, H, lo, hi, key, o = {}) {
  const n = H.length - 1, m = H[0].length - 1;
  st.raster((x, y) => {
    const j = Math.floor(x), i = Math.floor(-y);
    if (i < 0 || j < 0 || i > n || j > m) return null;
    const h = H[i][j];
    if (h < -1e8) return o.blank === false ? null : v.rgb('grid');
    const u = Math.max(0, Math.min(1, (h - lo) / Math.max(1e-9, hi - lo)));
    return v.ramp(u, o.color || 'accent');
  }, { res: o.res || 2, key });
}

// ───────────────────────────────────────────────────────────── real protein families (UniProt, see PROT)
export const FAMILIES = {
  globin: ['HBA_HUMAN', 'HBB_HUMAN', 'MYG_HUMAN', 'HBA_HORSE', 'HBB_HORSE', 'HBA_CHICK', 'HBB_CHICK', 'MYG_PHYMC', 'LGB4_SOYBN', 'BAHG_VITST', 'GLB5_PETMA', 'NGB_HUMAN', 'CYGB_HUMAN'],
  cytc: ['CYC_HUMAN', 'CYC_HORSE', 'CYC1_YEAST'],
  lyso: ['LYSC_CHICK', 'LYSC_HUMAN', 'LALBA_HUMAN', 'LALBA_BOVIN'],
  serine: ['TRY1_BOVIN', 'CTRA_BOVIN', 'ELNE_HUMAN'],
  thio: ['THIO_ECOLI', 'THIO_HUMAN'],
};
export const B62OPT = { score: scoreFn('blosum62'), go: 11, ge: 1 };
let _pairs = null;
// every within-family pair, aligned locally (BLOSUM62, gaps 11/1): identity over the aligned region and its aligned residue pairs
export function homologPairs() {
  if (_pairs) return _pairs;
  _pairs = [];
  for (const [fam, ids] of Object.entries(FAMILIES)) {
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const r = align(PROT[ids[a]].seq, PROT[ids[b]].seq, { ...B62OPT, local: true });
      const cols = []; let i = r.start[0], j = r.start[1];
      for (const op of r.ops) { if (op === 'D') { cols.push([r.s[i], r.t[j]]); i++; j++; } else if (op === 'V') i++; else j++; }
      _pairs.push({ fam, a: ids[a], b: ids[b], len: r.len, ident: r.ident, id: r.ident / r.len, score: r.score, cols });
    }
  }
  return _pairs;
}
// BLOSUM-style log-odds from aligned columns; pairs more identical than maxId are left out (a crude stand-in for clustering)
export function logOdds(maxId, pseudo = 1) {
  const P = homologPairs().filter((p) => p.id * 100 <= maxId);
  const c = Array.from({ length: 20 }, () => new Float64Array(20)); let N = 0;
  for (const p of P) for (const [x, y] of p.cols) { const i = aaIndex(x), j = aaIndex(y); if (i === undefined || j === undefined) continue; c[Math.min(i, j)][Math.max(i, j)]++; N++; }
  const q = new Float64Array(20);
  for (let i = 0; i < 20; i++) for (let j = i; j < 20; j++) { q[i] += c[i][j] / N / (i === j ? 1 : 2); if (i !== j) q[j] += c[i][j] / N / 2; }
  const S = Array.from({ length: 20 }, () => new Float64Array(20)), E = Array.from({ length: 20 }, () => new Float64Array(20)), Pm = Array.from({ length: 20 }, () => new Float64Array(20));
  for (let i = 0; i < 20; i++) for (let j = i; j < 20; j++) {
    const e = (i === j ? 1 : 2) * q[i] * q[j], p = c[i][j] / N;
    S[i][j] = S[j][i] = 2 * Math.log2((c[i][j] + pseudo) / (N * e + pseudo)); E[i][j] = E[j][i] = e; Pm[i][j] = Pm[j][i] = p;
  }
  return { S, E, P: Pm, c, q, N, pairs: P.length };
}
