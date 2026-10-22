import React from 'react';
import {DataComponent,DataTable,EvidenceChart,Filters,MetricCard,Section,SortableItem,SortableRegion,useDataApp,useDashboardTabs,useSectionFilters} from '../../data-app-public.jsx';
import './coverage.css';
const number=value=>value==null?'Not established':value.toLocaleString('en');
const sum=(rows,key)=>rows.reduce((n,r)=>n+(r[key]||0),0);
const wrap=value=><span className="coverage-cell">{value}</span>;
const stateName={'accepted':'Locally accepted','in-review':'In review','draft':'Draft','brief-only':'Brief only','withdrawn':'Withdrawn'};
const domainSpec={type:'horizontalStackedBar',x:'domain',y:'Accepted production',fields:['Accepted production','Planned syllabus'],showLegend:true,valueDecimals:0,colors:{'Accepted production':'var(--chart-1)','Planned syllabus':'var(--chart-5)'}};
function Metrics({domains,pilots}){
 const values=[{id:'production-accepted',title:'Accepted production ideas',value:sum(domains,'productionAccepted'),queryId:'domains',rows:domains},{id:'production-planned',title:'Planned syllabus ideas',value:sum(domains,'productionPlanned'),queryId:'domains',rows:domains},{id:'local-pilots',title:'Locally accepted pilots',value:pilots.filter(p=>p.state==='accepted').length+' / '+pilots.length,queryId:'pilots',rows:pilots},{id:'orientations',title:'Reviewed domain overviews',value:domains.length,queryId:'domains',rows:domains}];
 return <SortableRegion id="coverage:metrics" variant="canvas" columns={12} spacing="standard" rows={[{id:'coverage:counts',kind:'metrics',items:values.map(x=>x.id)}]} label="Coverage counts">{values.map(m=><SortableItem key={m.id} id={m.id} label={m.title} kind="metric" span={3}><MetricCard id={m.id} queryId={m.queryId} title={m.title} value={typeof m.value==='number'?number(m.value):m.value} displayRows={m.rows} sourceRows={m.rows}/></SortableItem>)}</SortableRegion>;
}
function Coverage({domains,pilots}){
 const display=domains.map(d=>({domainId:d.domainId,domain:d.domainId+' · '+d.domain,'Accepted production':d.productionAccepted,'Planned syllabus':d.productionPlanned}));
 return <>
  <Metrics domains={domains} pilots={pilots}/>
  <Section id="coverage:inventory-heading" title="Coverage by domain" spacing="after-metrics">
   <p className="coverage-note">Production ideas belong to one primary domain here. Cross-listings provide additional entrances. Local pilots and overviews are separate from production content.</p>
   <EvidenceChart id="coverage:domain-chart" queryId="domains" title="Accepted and planned production ideas" spec={domainSpec} rows={display} sourceRows={domains} height={Math.max(230,domains.length*32+85)} variant="card"/>
   <DataComponent id="coverage:domain-table" queryId="domains" kind="table" title="Domain scope and local starting points" displayRows={domains} sourceRows={domains} variant="card">
    <DataTable rows={domains} rowKey="domainId" label="Domain coverage" columns={[
     {key:'domain',label:'Domain',renderCell:(value,row)=><a className="coverage-cell" href={'../domains/'+row.domainId+'/'}>{row.domainId+' · '+value}</a>},
     {key:'primaryCollections',label:'Primary collections'},{key:'crossListedCollections',label:'Cross-listings'},{key:'localAuthored',label:'Local pilots authored'},{key:'localAccepted',label:'Local pilots accepted'},{key:'orientationReviewAgeDays',label:'Latest overview AI receipt age (days)'},{key:'introductoryCoverage',label:'Introductory syllabus'}]}/>
   </DataComponent>
  </Section>
  <Section id="coverage:gaps-heading" title="What remains missing">
   <DataComponent id="coverage:gaps" queryId="domains" kind="table" title="Domain gaps and stewardship" displayRows={domains} sourceRows={domains} variant="card">
    <DataTable rows={domains} rowKey="domainId" label="Domain gaps" columns={[{key:'domain',label:'Domain'},{key:'gaps',label:'Recorded gap',renderCell:wrap},{key:'maintainerRole',label:'Proposed role, unassigned',renderCell:wrap}]}/>
   </DataComponent>
  </Section>
 </>;
}
function WorkStreams({domains}){
 const {reviewedRows}=useDataApp(),wave=reviewedRows('wave',['chapter','domainId']);
 const waveStates=[{state:'Accepted',items:sum(wave,'accepted')},{state:'Awaiting review',items:sum(wave,'awaitingReview')},{state:'Other items',items:sum(wave,'outsideReviewedCheckpoints')}];
 const visualStates=[{state:'Redesigned',items:sum(domains,'redesigned')},{state:'Retained',items:sum(domains,'retained')},{state:'Pending',items:sum(domains,'visualPending')}];
 const bar={type:'horizontalBar',x:'state',y:'items',showLegend:false,valueDecimals:0,stackable:false};
 const reconciliation=reviewedRows('reconciliation');
 return <>
  <Section id="streams:heading" title="Independent work streams" columns={2} spacing="none">
   <EvidenceChart id="streams:wave" queryId="wave" title={'Wave 6 · '+number(sum(wave,'total'))+' frozen ideas'} rows={waveStates} sourceRows={wave} spec={bar} height={260} variant="card"><p className="coverage-note">Author verification is reported by the expansion ledger. Items outside these checkpoints may include other drafts; they are not all unwritten.</p></EvidenceChart>
   <EvidenceChart id="streams:visual" queryId="domains" title={'Visual review · '+number(sum(domains,'visualScope'))+' scoped ideas'} rows={visualStates} sourceRows={domains} spec={bar} height={260} variant="card"><p className="coverage-note">This ledger has its own denominator, including preserved drafts. Visual review does not grant content acceptance or apply the redesign to production.</p></EvidenceChart>
  </Section>
  <Section id="streams:chapter-heading" title="Frozen chapter checkpoints">
   <DataComponent id="streams:chapters" queryId="wave" kind="table" title="Acceptance and author verification" displayRows={wave} sourceRows={wave} variant="card"><DataTable rows={wave} rowKey="chapter" label="Frozen chapter checkpoints" columns={[{key:'chapter',label:'Chapter'},{key:'total',label:'Frozen ideas'},{key:'accepted',label:'Accepted'},{key:'awaitingReview',label:'Author-verified'},{key:'outsideReviewedCheckpoints',label:'Outside checkpoints'}]}/></DataComponent>
  </Section>
  <Section id="streams:evidence-heading" title="Evidence limits">
   <DataComponent id="streams:human" queryId="domains" title="Accessibility and learning evidence" displayRows={domains} sourceRows={domains} variant="card"><p>Atlas-wide counts of human accessibility reviews and learning evaluations are <strong>not established</strong> by these ledgers. Automated checks and AI reviews do not supply those observations.</p></DataComponent>
   <DataComponent id="streams:reconciliation" queryId="reconciliation" title="Ledger reconciliation" displayRows={reconciliation} sourceRows={reconciliation} variant="card">{reconciliation.map(r=><p key={r.id} data-reviewed-rows>{r.message}</p>)}</DataComponent>
  </Section>
 </>;
}
function Reviews(){
 const {reviewedRows}=useDataApp();
 const pilotScope=useSectionFilters([{id:'state',label:'Pilot state',field:'state',defaultValue:'all',queryIds:['pilots'],choiceLabels:stateName}],{},{id:'review:pilot-scope'});
 const classificationScope=useSectionFilters([{id:'scheme',label:'Classification',field:'schemeId',defaultValue:'all',queryIds:['classifications']}],{},{id:'review:classification-scope'});
 const pilotProps=pilotScope.componentProps('pilots',['id','state']),classProps=classificationScope.componentProps('classifications',['id','schemeId']);
 const pilots=pilotProps.displayRows.map(p=>({...p,stateLabel:stateName[p.state],reviewAge:p.reviewAgeDays===null?'No current receipt':p.reviewAgeDays+' days',pending:p.missingRequiredReviews|| (p.state==='accepted'?'Required local AI reviews recorded':'See brief'),gates:p.openGates.join(' · ')||'Public integration and release review remain.'}));
 const summary=reviewedRows('summary');
 return <>
  <Section id="review:pilots-heading" title="Eight-pilot programme" filters={<Filters {...pilotScope.filterProps}/>} spacing="none">
   <DataComponent id="review:pilots" queryId="pilots" title="Pilot review queue" kind="table" {...pilotProps} displayRows={pilots} variant="card">
    <DataTable rows={pilots} rowKey="id" label="Pilot review queue" columns={[{key:'id',label:'Pilot'},{key:'title',label:'Exploration',renderCell:(value,row)=><a className="coverage-cell" href={row.explorationId?'../'+row.explorationId+'/':'../../../'+row.briefPath}>{value}</a>},{key:'stateLabel',label:'State'},{key:'reviewAge',label:'Latest AI receipt age'},{key:'pending',label:'Required reviews',renderCell:wrap},{key:'nextAction',label:'Next action',renderCell:wrap}]}/>
   </DataComponent>
   <DataComponent id="review:pilot-limits" queryId="pilots" title="Remaining scope and real-world checks" kind="table" {...pilotProps} displayRows={pilots} variant="card"><DataTable rows={pilots} rowKey="id" label="Pilot limitations" columns={[{key:'id',label:'Pilot'},{key:'gates',label:'Preparation and release gates',renderCell:wrap},{key:'limitations',label:'Observed limits',renderCell:value=>wrap(value.join(' '))}]}/></DataComponent>
  </Section>
  <Section id="review:classification-heading" title="Classification decisions still open" filters={<Filters {...classificationScope.filterProps}/> }>
   <DataComponent id="review:classifications" queryId="classifications" title="Source and community review queue" kind="table" {...classProps} variant="card"><DataTable rows={classProps.displayRows} rowKey="id" label="Classification review queue" columns={[{key:'schemeId',label:'Scheme'},{key:'code',label:'Code'},{key:'domainIds',label:'Candidate domains',renderCell:value=>value.join(', ')},{key:'nextAction',label:'Next action',renderCell:wrap}]}/></DataComponent>
  </Section>
  <Section id="review:sequence-heading" title="Sequence target">
   <DataComponent id="review:sequence" queryId="summary" title="Progress toward 24 pilot lessons" displayRows={summary} sourceRows={summary} variant="card"><p data-reviewed-rows><strong>{summary[0].localAuthored} authored</strong> and <strong>{summary[0].localAccepted} locally accepted</strong> of the planned 24 lessons. The target is three lessons for each of eight pilots; proposed follow-ups are not authored lessons.</p></DataComponent>
  </Section>
 </>;
}
export function DashboardContent(){
 const {activeTabId}=useDashboardTabs([{id:'coverage',label:'Coverage',filterIds:['domain']},{id:'streams',label:'Work streams',filterIds:['domain']},{id:'reviews',label:'Review queue',filterIds:[]}]);
 const {snapshot,queries,filters,setFilter,reviewedRows}=useDataApp();
 const domains=reviewedRows('domains',['domainId']),selected=new Set(domains.map(d=>d.domainId)),pilots=reviewedRows('pilots',['id']).filter(p=>p.domainIds.some(id=>selected.has(id)));
 return <div className="coverage-dashboard">
  <nav className="coverage-links" aria-label="Atlas navigation"><a href="../domains/">Explore 30 domains</a><a href="../">Local pilots</a><a href="../../../#/status">Production status</a></nav>
  <p className="coverage-note" data-reviewed-rows>Snapshot: {snapshot.generatedAt.replace('T',' ').replace('Z',' UTC')}. Later work in the other chats is not included. Review ages are measured at this snapshot.</p>
  {activeTabId!=='reviews'&&<Filters filters={snapshot.filters} queries={queries} values={filters} onChange={setFilter}/>}
  {activeTabId==='streams'?<WorkStreams domains={domains}/>:activeTabId==='reviews'?<Reviews/>:<Coverage domains={domains} pilots={pilots}/>}
 </div>;
}
