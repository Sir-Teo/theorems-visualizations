// Dated source counts, not inferred ancestral retention or gene homology.
const ROWS=[
 {id:'caulobacter',label:'Caulobacter CB15',coding:3767,bp:4016942,source:'Nierman 2001:3767 predicted ORFs and 4016942 bp; historical CB15 annotation.'},
 {id:'rickettsia',label:'Rickettsia Madrid E',coding:834,bp:1111523,source:'Andersson 1998:834 complete protein-coding ORFs and 1111523 bp; historical Madrid E annotation.'},
 {id:'reclinomonas',label:'Reclinomonas mtDNA',coding:67,bp:69034,source:'NC_001823.1:67 CDS features and 69034 bp; provisional RefSeq record dated 3 April 2023. Its 97 gene features are a different inclusive count.'},
 {id:'human',label:'Human mtDNA',coding:13,bp:16569,source:'NC_012920.1:13 CDS features and 16569 bp; provisional revised Cambridge RefSeq record dated 3 April 2023, not an unchanged 1981 sequence. Its 37 gene features also include RNA genes.'}
];
export const endosymRows=()=>structuredClone(ROWS);
export function endosymModel(source='reclinomonas',quantity='coding'){
 if(typeof source!=='string'||!ROWS.some(r=>r.id===source)||!['coding','bp'].includes(quantity))throw new RangeError('Known source genome and quantity required');
 const rows=ROWS.map(r=>({...r,value:r[quantity],x:Math.log10(r[quantity])})),selected=rows.find(r=>r.id===source),human=rows.at(-1),total=1136,mitochondrial=13,nuclear=total-mitochondrial;
 return{source,quantity,rows,selected,ratio:selected.value/human.value,logRatio:Math.log10(selected.value)-Math.log10(human.value),total,mitochondrial,nuclear,mitochondrialFraction:mitochondrial/total,nuclearFraction:nuclear/total,cells:Array.from({length:total},(_,i)=>({x:i%48,y:23-Math.floor(i/48),mitochondrial:i<mitochondrial}))};
}
