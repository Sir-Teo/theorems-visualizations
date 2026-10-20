// Literal historical summaries; they are not new specimen data or current species ranges.
const rows=[
 {id:'australopiths',label:'Australopiths',kind:'range',lo:400,hi:500,copyVolume:450,n:null,description:'Approximate 400–500 cm³ interval in the 1995 authors’ synthesis; 450 is only its chosen midpoint.'},
 {id:'habilis',label:'H. habilis / rud.',kind:'mean-sd',lo:557.8,hi:750.2,point:654,sd:96.2,n:8,copyVolume:654,description:'H. habilis/rudolfensis: source mean 654 cm³, standard deviation 96.2 cm³, n=8. The whisker is one SD, not a confidence interval or full range.'},
 {id:'ergaster',label:'Early H. ergaster',kind:'approximate',point:850,copyVolume:850,n:null,description:'Approximately 850 cm³ for earliest African H. ergaster in the 1995 narrative; no uncertainty interval or sample count is supplied here.'},
 {id:'modern',label:'Modern summary',kind:'approximate',point:1400,copyVolume:1400,n:null,description:'Approximately 1400 cm³ for modern humans in the 1995 narrative; this is not a universal individual value or a present-day population mean.'}
];
export const homininSummaries=()=>structuredClone(rows);
export function homininModel(volume=1300,body=65,density=1,selected='modern'){
 if(!Number.isFinite(volume)||volume<350||volume>1800||!Number.isFinite(body)||body<25||body>90||!Number.isFinite(density)||density<.95||density>1.1||!rows.some(q=>q.id===selected))throw new RangeError('Outside authored hominin accounting domain');
 const mass=volume*density/1000,brain=11.2*mass,total=3.39*body**.75,source={body:65,brainMass:1.3,brain:14.6,total:90.6,reportedShare:16.1,reportedBodyShare:2,coefficient:11.2},categories=homininSummaries();
 return{volume,body,density,selected,mass,brain,total,remaining:total-brain,share:100*brain/total,source:{...source,share:100*source.brain/source.total,unroundedBrain:source.brainMass*source.coefficient},categories,summary:categories.find(q=>q.id===selected)};
}
