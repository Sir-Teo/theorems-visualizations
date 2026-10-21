// Node test support, exact unedited function bodies inserted as a tiny lexical closure.
import{exactLoaderBodies,sha}from'./map-paired-selected-shard-fixture.mjs';
export function tinyFactorySource(app){const bodies=exactLoaderBodies(app);return{bodyHashes:Object.fromEntries(Object.entries(bodies).map(([k,v])=>[k,sha(v)])),source:`function makeTiny(index,fetch,SceneBudget,observeBudget){
const C=index.collections.find(c=>c.id==='ladr'),items=index.items.filter(it=>it.col==='ladr'),G={items,planned:[],collections:[C],fields:index.fields,byId:new Map(items.map(it=>[it.id,it])),colById:new Map([['ladr',C]])};
const shards=new Map(),shardData=new Map();const chapterOf=(col,c)=>G.colById.get(col)?.chapters.find(ch=>ch.n===c);
${Object.values(bodies).join('\n')}
const nodes=items.map((it,order)=>({it,x:it.x,y:it.y,r:3,order})),byId=new Map(nodes.map(n=>[n.it.id,n])),edges=[];for(const n of nodes)for(const d of n.it.deps||[])if(byId.has(d))edges.push([byId.get(d),n]);const budget=new SceneBudget(64000000);observeBudget(budget);const models=new Map();for(const key of ['bundles:0.5','edges:0.5','edges:4']){const model={ranges:[{startPoint:0,segments:1}],released:false,pointCount:2,segmentCount:1};models.set(key,model);budget.reserve(model,100,()=>{}, {evictable:true});}
const m={G,nodes,byId,edges,top:nodes.slice(0,2),nodeBins:new Map([['bin',nodes.slice()]]),closures:new Map(),loadShard,W:600,H:500,dpr:2,k:.8,tx:0,ty:0,_raf:0,anim:0,sel:null,hover:null};const scene={map:m,status:'ready',generation:1,controlKey:'fixed',pending:new Map(),models,groups:new Map(),budget,painter:{atlas:{generation:1,cache:new Map()}},ready:Promise.resolve()};return{scene,G,shards,shardData,loadShard};
}`};}
export function exactNeedSt(graph){const start=graph.indexOf('  needSt(it, then) {'),end=graph.indexOf('\n  select(n, fly)',start);if(start<0||end<0)throw Error('needSt seam');return graph.slice(start,end).trim();}
