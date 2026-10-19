// Inputs inspected against complete primary tables/formats; provenance and raw
// catalogue records are preserved in docs/verification/astro-hr-values.json.
// L derived from source R,T uses nominal solar5772K, so it obeys the same
// Stefan–Boltzmann conversion as the diagram (not a new measured luminosity).
const fromRT=(name,T,R,family,source)=>[name,T,R*R*(T/5772)**4,family,source];
export const HR_STARS=[
 fromRT('DV Psc A',4450,.685,'ms','Eker2018 Table1: R=0.685 R☉, T=4450K'),
 fromRT('DV Psc B',3614,.514,'ms','Eker2018 Table1: R=0.514 R☉, T=3614K'),
 ['Sun',5772,1,'ms','IAU2015 B3 nominal reference'],
 fromRT('V421 Peg A',7250,1.584,'ms','Eker2018 Table1: R=1.584 R☉, T=7250K'),
 fromRT('V421 Peg B',6980,1.356,'ms','Eker2018 Table1: R=1.356 R☉, T=6980K'),
 fromRT('GSC4019-3345 A',8600,1.760,'ms','Eker2018 Table1: R=1.760 R☉, T=8600K'),
 fromRT('MU Cas A',14750,4.192,'ms','Eker2018 Table1: R=4.192 R☉, T=14750K'),
 fromRT('MU Cas B',15100,3.671,'ms','Eker2018 Table1: R=3.671 R☉, T=15100K'),
 ['HIP765',4918,60.63,'g','McDonald2012 SED model; parallax-distance error2%, not a T/L error bar'],
 ['HIP24372',4433,423.64,'g','McDonald2012 SED model; parallax-distance error2%, not a T/L error bar'],
 ['HIP63355',3881,353.27,'g','McDonald2012 SED model; parallax-distance error3%, not a T/L error bar'],
 ['example supergiant',3500,1e5,'sg','chosen illustrative point; no observed star or frequency is implied'],
 fromRT('Procyon B',7740,.01232,'wd','Bond, Bergeron & Bédard2017 Table1: T=7740±50K, R=0.01232±0.00032 R☉'),
 fromRT('40 Eridani B',17200,.01308,'wd','Bond, Bergeron & Bédard2017 §4/Table1: T=17200±110K, R=0.01308±0.00020 R☉'),
 fromRT('Sirius B',25369,.008098,'wd','Bond, Bergeron & Bédard2017 Table1: T=25369±46K, R=0.008098±0.000046 R☉'),
];
