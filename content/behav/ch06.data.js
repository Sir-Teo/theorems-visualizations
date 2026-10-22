// Gneezy & Rustichini (2000), A Fine Is a Price, original published Table1, printedp6.
// https://rady.ucsd.edu/_files/faculty-research/uri-gneezy/fine.pdf
// Late-pickup events per observed week, not distinct parents or a probability.
// [centre, children, fine introduced, weeks1–20]; six treated/four controls.
export const daycareRows=[
 [1,37,true,[8,8,7,6,8,9,9,12,13,13,15,13,14,16,14,15,16,13,15,17]],
 [2,35,true,[6,7,3,5,2,11,14,9,16,12,10,14,14,16,12,17,14,10,14,15]],
 [3,35,true,[8,9,8,9,3,5,15,18,16,14,20,18,25,22,27,19,20,23,23,22]],
 [4,34,true,[10,3,14,9,6,24,8,22,22,19,25,18,23,22,24,17,15,23,25,18]],
 [5,33,true,[13,12,9,13,15,10,27,28,35,10,24,32,29,29,26,31,26,35,29,28]],
 [6,28,true,[5,8,7,5,5,9,12,14,19,17,14,13,10,15,14,16,6,12,17,13]],
 [7,35,false,[7,10,12,6,4,13,7,8,5,12,3,5,6,13,7,4,7,10,4,6]],
 [8,34,false,[12,9,14,18,10,11,6,15,14,13,7,12,9,9,17,8,5,11,8,13]],
 [9,34,false,[3,4,9,3,3,5,9,5,2,7,6,6,9,4,9,2,3,8,3,5]],
 [10,32,false,[15,13,13,12,10,9,15,15,15,10,17,12,13,11,14,17,12,9,15,13]],
];
// Published Table2 values are kept separately; full-period values are printed to one decimal.
export const daycarePrintedPeriods=[
 [7.25,9.5,12.5,15.25],[5.25,9,12.2,13.25],[8.5,10.25,16.8,22],
 [9,15,19.1,20.25],[11.75,20,24.6,29.5],[6.25,10,13.1,12],
 [8.75,8,7.2,6.75],[13.25,10.5,10.9,9.25],[4.75,5.5,5.5,4.75],[13.25,12.25,13.1,12.25],
];
// Fehr–Gächter (2000), published Tables 3–4. Tokens per player, endowment 20.
// Columns: session/group, no-punishment mean, punishment mean, final no-punishment,
// final punishment. The final period is each condition's tenth period.
export const publicGoodsStrangerRows=[
 [1,2.7,10.9,1.3,9.8],[2,4.0,12.9,2.3,14.3],[3,4.5,10.7,2.0,13.1],
];
export const publicGoodsPartnerRows=[
 [1,7.0,17.5,5.8,19.5],[2,10.6,16.4,1.0,19.3],[3,6.7,18.4,6.3,20.0],
 [4,5.1,12.1,1.3,13.5],[5,6.4,14.3,1.8,10.5],[6,7.9,19.0,3.5,20.0],
 [7,7.4,19.0,2.5,20.0],[8,10.0,17.2,5.0,20.0],[9,3.9,17.0,0.0,20.0],
 [10,10.0,19.0,5.0,19.5],
];
// Güth–Schmittberger–Schwarze (1982), actual Table 4 and Table 5, PDF page 9.
// A–U in order; [stake, proposer demand, accepted], money in hundredths of DM.
// The offer is stake minus demand. Both stages involve 21 observed pairs.
export const ultimatumFirstRows=[
 [1000,600,1],[900,860,1],[800,400,1],[400,200,1],[500,350,1],[600,300,1],
 [700,350,1],[1000,500,1],[1000,500,1],[900,500,1],[900,555,1],[800,435,1],
 [800,500,1],[700,500,1],[700,585,1],[600,400,1],[600,480,0],[500,250,1],
 [500,300,1],[400,400,0],[400,400,1],
];
export const ultimatumRepeatRows=[
 [1000,700,1],[1000,750,1],[900,450,1],[900,600,1],[800,500,1],[800,700,1],
 [700,400,1],[700,500,1],[400,300,0],[400,300,0],[500,499,0],[500,300,1],
 [600,500,0],[600,380,1],[1000,600,1],[900,450,1],[800,650,1],[700,400,0],
 [600,300,1],[500,400,0],[400,300,1],
];
// Nagel (1995), Figure 1, printed p. 1316; pooled FIRST-round summaries.
// [p numerator, p denominator, mean, median]. No reconstructed histogram.
export const beautyFirstSummaries=[[1,2,27.05,17],[2,3,36.73,33],[4,3,60.12,66]];
