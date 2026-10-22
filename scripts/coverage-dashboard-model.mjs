// Pure accounting model: canonical identities remain separate from navigation and review scopes.
const requireThat=(ok,message)=>{if(!ok)throw new Error(message);};
const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]||0),0);
const unique=(rows,key,label)=>{requireThat(Array.isArray(rows)&&rows.every(r=>r&&typeof r==='object'&&typeof r[key]==='string'),label+': expected identity rows');const ids=rows.map(r=>r[key]);requireThat(new Set(ids).size===ids.length,label+': duplicate identity');return new Set(ids);};
export function reviewAge(reviewedOn,asOf){if(!reviewedOn)return null;const day=Date.parse(reviewedOn+'T00:00:00Z'),cutoff=Date.parse(asOf);requireThat(Number.isFinite(day)&&Number.isFinite(cutoff)&&day<=cutoff,'Invalid or future review date');return Math.floor((cutoff-day)/86400000);}
export function buildCoverageModel(d){
 requireThat(d?.schemaVersion===1&&Number.isFinite(Date.parse(d.asOf)),'Invalid dashboard snapshot');
 const domainIds=unique(d.domains,'id','domains'),collectionIds=unique(d.accepted.collections,'id','collections'),written=unique(d.accepted.items,'id','accepted items'),planned=unique(d.accepted.plannedItems,'id','planned items');
 requireThat(domainIds.size===30&&collectionIds.size===85,'Declared inventory differs from 30 domains / 85 collections');
 for(const id of planned)requireThat(!written.has(id),'Written and planned identities overlap: '+id);
 requireThat(planned.size===d.accepted.plannedCount,'Planned catalog total does not reconcile');
 const mappingIds=new Set();const homes=new Map();for(const m of d.collectionMappings){requireThat(domainIds.has(m.domainId)&&collectionIds.has(m.collectionId),'Unknown collection/domain mapping');requireThat(['primary','cross-listed'].includes(m.relationship),'Unknown collection relationship');const key=m.collectionId+':'+m.domainId;requireThat(!mappingIds.has(key),'Duplicate collection mapping');mappingIds.add(key);if(m.relationship==='primary'){requireThat(!homes.has(m.collectionId),'Multiple primary homes');homes.set(m.collectionId,m.domainId);}}
 requireThat(homes.size===collectionIds.size,'Missing primary collection home');
 for(const r of [...d.accepted.items,...d.accepted.plannedItems])requireThat(collectionIds.has(r.collectionId)&&r.id.startsWith(r.collectionId+'-'),'Unknown/mismatched canonical collection');
 const collectionRows=d.accepted.collections.map(c=>{
  const accepted=d.accepted.items.filter(r=>r.collectionId===c.id).length,unwritten=d.accepted.plannedItems.filter(r=>r.collectionId===c.id).length;
  requireThat(accepted===c.written&&unwritten===c.planned,'Collection counts do not reconcile: '+c.id);
  return {...c,domainId:homes.get(c.id)};
 });
 const orientations=unique(d.orientations,'domainId','orientations');requireThat(orientations.size===30&&[...orientations].every(id=>domainIds.has(id)),'Missing orientation');
 for(const r of d.orientations)requireThat(r.status==='reviewed-local'&&r.reviewedOn,'Orientation is not currently reviewed');
 unique(d.briefs,'id','pilot briefs');unique(d.pilots,'id','pilot records');unique(d.pilots,'pilotId','implemented pilots');requireThat(d.briefs.length===8,'Expected eight pilot briefs');
 for(const p of d.pilots){requireThat(d.briefs.some(b=>b.id===p.pilotId),'Unknown pilot brief');requireThat(['draft','in-review','accepted','withdrawn'].includes(p.status),'Unknown pilot status');requireThat(p.publication==='local-preview','Unexpected pilot publication');requireThat(p.domainIds.every(id=>domainIds.has(id)),'Unknown pilot domain');}
 unique(d.wave.chapters,'key','Wave chapters');unique(d.wave.reportedChapters,'key','Author-verified chapters');
 const frozenIds=unique(d.wave.chapters.flatMap(c=>c.ids.map(id=>({id}))),'id','Frozen wave items');requireThat(frozenIds.size===d.wave.total&&d.wave.total===1057,'Frozen Wave 6 total mismatch');
 const reported=new Map(d.wave.reportedChapters.map(c=>[c.key,c]));
 const waveRows=d.wave.chapters.map(c=>{
  requireThat(collectionIds.has(c.collectionId),'Unknown wave collection');requireThat(c.key.startsWith(c.collectionId+'/')&&c.ids.every(id=>id.startsWith(c.collectionId+'-')),'Wave canonical collection mismatch');const accepted=c.ids.filter(id=>written.has(id)).length,claim=reported.get(c.key);
  if(claim)requireThat(claim.count===c.ids.length&&accepted===0,'Author-verified chapter overlaps acceptance or count differs');
  return {domainId:homes.get(c.collectionId),chapter:c.key,total:c.ids.length,accepted,awaitingReview:claim?claim.count:0,outsideReviewedCheckpoints:c.ids.length-accepted-(claim?claim.count:0)};
 });
 requireThat(sum(waveRows,'awaitingReview')===d.wave.declaredPending,'Author verification total mismatch');requireThat(sum(waveRows,'accepted')===d.wave.currentLedgerProgress,'Accepted source / current Wave ledger disagree');
 const visualIds=unique(d.redesign.items,'id','Visual ledger');requireThat(visualIds.size===d.redesign.scope.wave5+d.redesign.scope.wave6,'Visual scope denominator mismatch');
 for(const r of d.redesign.items){requireThat(collectionIds.has(r.collectionId),'Unknown visual collection');requireThat(r.id.startsWith(r.collectionId+'-'),'Visual canonical collection mismatch');requireThat(['pending','verified','retained-verified'].includes(r.status),'Unknown visual acceptance status');if(r.status!=='pending')requireThat(typeof r.evidence==='string'&&r.evidence.trim(),'Visual acceptance lacks evidence');requireThat(written.has(r.id)||frozenIds.has(r.id),'Visual ledger has unknown canonical item');}
 const pilotRows=d.briefs.map(b=>{
  const p=d.pilots.find(p=>p.pilotId===b.id),current=p?.reviews.filter(r=>r.result==='passed')||[],dates=current.map(r=>r.reviewedOn).sort(),date=dates.at(-1)||null;
  const latest=new Map((p?.reviews||[]).map(r=>[r.dimension,r]));
  const missing=p?p.requirements.filter(dim=>latest.get(dim)?.result!=='passed'):[];
  if(p?.status==='accepted')requireThat(missing.length===0,'Accepted local pilot lacks required review');
  return {id:b.id,domainIds:b.domainIds,title:b.title,state:p?.status||'brief-only',explorationId:p?.id||null,revision:p?.revision||null,reviewedOn:date,reviewAgeDays:reviewAge(date,d.asOf),missingRequiredReviews:missing.join(', ')||null,
   nextAction:p?.status==='accepted'?'Prepare public loading and release-specific review; retain scoped local acceptance.':b.nextAction,
   openGates:p?.status==='accepted'?[]:b.openGates,limitations:p?.limitations||['Pilot not implemented; professional preparation gates remain.'],briefPath:b.briefPath,
   humanAccessibilityObserved:null,learningObserved:null};
 });
 const domainRows=d.domains.map(domain=>{
  const cols=collectionRows.filter(c=>c.domainId===domain.id),pilots=d.pilots.filter(p=>p.domainIds.includes(domain.id)&&p.status!=='withdrawn'),visual=d.redesign.items.filter(r=>homes.get(r.collectionId)===domain.id),orientation=d.orientations.find(r=>r.domainId===domain.id);
  return {domainId:domain.id,domain:domain.title,primaryCollections:cols.length,crossListedCollections:d.collectionMappings.filter(m=>m.domainId===domain.id&&m.relationship==='cross-listed').length,productionAccepted:sum(cols,'written'),productionPlanned:sum(cols,'planned'),orientation:orientation.status,orientationReviewAgeDays:reviewAge(orientation.reviewedOn,d.asOf),localAuthored:pilots.length,localAccepted:pilots.filter(p=>p.status==='accepted').length,visualScope:visual.length,redesigned:visual.filter(r=>r.status==='verified').length,retained:visual.filter(r=>r.status==='retained-verified').length,visualPending:visual.filter(r=>r.status==='pending').length,humanAccessibilityReviewed:null,learningEvaluated:null,introductoryCoverage:domain.coverage.introductory,gaps:domain.gaps.map(g=>g.description).join(' | '),maintainerRole:domain.maintainerRole};
 });
 requireThat(sum(domainRows,'productionAccepted')===written.size&&sum(domainRows,'productionPlanned')===planned.size,'Primary-domain join multiplied or lost items');
 unique(d.classifications,'id','Classifications');requireThat(d.classifications.length===217,'Classification inventory mismatch');
 for(const c of d.classifications)requireThat(['mapped','review','excluded'].includes(c.disposition)&&c.domainIds.every(id=>domainIds.has(id)),'Invalid classification disposition/domain');
 const classificationRows=d.classifications.filter(c=>c.disposition==='review').map(c=>{requireThat(c.nextAction,'Review category lacks next action');return c;});
 return {schemaVersion:1,asOf:d.asOf,domainRows,collectionRows,waveRows,pilotRows,classificationRows,
  summary:{productionAccepted:written.size,productionPlanned:planned.size,collections:collectionIds.size,domains:domainIds.size,orientations:orientations.size,localAuthored:d.pilots.filter(p=>p.status!=='withdrawn').length,localAccepted:d.pilots.filter(p=>p.status==='accepted').length,pilotBriefs:d.briefs.length,sequenceTarget:24,waveAccepted:sum(waveRows,'accepted'),waveAuthorVerified:sum(waveRows,'awaitingReview'),waveOutsideReviewedCheckpoints:sum(waveRows,'outsideReviewedCheckpoints'),waveTotal:d.wave.total,visualScope:visualIds.size,redesigned:d.redesign.items.filter(r=>r.status==='verified').length,retained:d.redesign.items.filter(r=>r.status==='retained-verified').length,visualPending:d.redesign.items.filter(r=>r.status==='pending').length,visualOutsideAccepted:d.redesign.items.filter(r=>!written.has(r.id)).length,classificationReview:classificationRows.length,humanAccessibilityReviewed:null,learningEvaluated:null},
  discrepancies:d.wave.acceptedProgressAtBase===sum(waveRows,'accepted')?[]:[{id:'base-wave-progress',message:'The accepted commit carries an older saved Wave progress total ('+d.wave.acceptedProgressAtBase+'). Canonical item IDs and the current owning ledger establish '+sum(waveRows,'accepted')+' accepted Wave 6 items; frozen assignments are unchanged.'}]
 };
}
