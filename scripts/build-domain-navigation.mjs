// Compose a new candidate after edition delivery. Existing authoring/review artifacts are read only.
import {readFile,writeFile,mkdir,readdir,lstat} from 'node:fs/promises';
import {readFileSync,realpathSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT} from './lib.mjs';
import {buildEditions,deliveryBinding,loadEditionArchive} from './build-exploration-editions.mjs';
import {resolveReleases,renderEditions} from './exploration-editions.mjs';
import {readOrientation,buildDomainOverviews,codePaths} from './build-domain-overviews.mjs';
import {canonicalBase} from './static-ideas.mjs';
import {NAV_CODE,hash,json,resolveDomainReleases,renderDomainNavigation,attachDomainNavigation} from './domain-navigation.mjs';

export async function inventory(root,prefix=''){
  const files={};for(const e of await readdir(join(root,prefix),{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())Object.assign(files,await inventory(root,p));else if(e.isFile())files[p]=hash(await readFile(join(root,p)));else throw new Error('Nonregular navigation candidate: '+p);}return files;
}
const readEvidence=path=>{const real=realpathSync(join(ROOT,path));if(!real.startsWith(realpathSync(ROOT)+'/'))throw new Error('Navigation evidence escapes checkout');return readFileSync(real,'utf8');};
export async function navigationBinding(data,root=ROOT){
  const prior=await deliveryBinding(root),files={...prior.files};
  const paths=[...NAV_CODE,...codePaths,'docs/coverage/registry.json','docs/coverage/overviews.json','docs/coverage/overview-sources.json','editions/manifest.json','editions/releases.json',...data.catalog.review.receipts.map(r=>r.evidencePath)];
  for(const p of paths)files[p]=hash(await readFile(join(root,p)));
  const sorted=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)));
  return {digest:hash(json(sorted)),files:sorted,editionDeliveryDigest:prior.digest};
}
export async function prepareNavigation({mode='preview',base=null}={}){
  if(!['preview','release'].includes(mode))throw new Error('Use preview or release navigation mode');
  base=canonicalBase(base);if(mode==='preview'&&base||mode==='release'&&!base)throw new Error('Preview has no canonical base; release needs --base-url');
  const verification=await buildDomainOverviews({checkOnly:true}),data=await readOrientation(),binding=await navigationBinding(data);
  if(!['reviewed-local','author-checked-local'].includes(verification.reviewStatus))throw new Error('Domain navigation requires exact reviewed orientation content');
  const {bundles,runtimes}=await loadEditionArchive(),editionLedger=JSON.parse(await readFile(join(ROOT,'editions/releases.json'),'utf8'));
  const editionEntries=mode==='preview'?[...bundles.values()].map(e=>({...e,state:'preview'})):resolveReleases(editionLedger,bundles,{deliveryDigest:binding.editionDeliveryDigest,base,readEvidence});
  const catalog=JSON.parse(renderEditions(editionEntries,runtimes,{mode,base}).outputs.get('explore/catalog.json'));
  const ledger=JSON.parse(await readFile(join(ROOT,'navigation/releases.json'),'utf8'));
  const entries=mode==='preview'?data.catalog.overviews.map(r=>({id:r.domainId,revision:r.revision,state:'preview'})):resolveDomainReleases(ledger,data,{navigationDigest:binding.digest,sourceArtifactDigest:verification.artifactDigest,base,readEvidence});
  const rendered=renderDomainNavigation(data,entries,catalog,{mode,base});
  const assets={};
  if(entries.length)for(const [from,to]of [['orientation/style.css','orientation.css'],['navigation/style.css','delivery.css'],['navigation/ui.mjs','ui.mjs'],['navigation/filter.mjs','filter.mjs']])assets['assets/domain-navigation/'+to]=await readFile(join(ROOT,from),'utf8');
  return {data,verification,binding,catalog,entries,rendered,assets,mode,base};
}
export async function buildDomainNavigation({out,mode='preview',base=null}={}){
  const prepared=await prepareNavigation({mode,base});base=prepared.base;
  const {binding,verification,rendered,assets,catalog}=prepared;
  const predecessor=await buildEditions({out,mode,base}),output=predecessor.output,before=await inventory(output);
  if(predecessor.deliveryDigest!==binding.editionDeliveryDigest)throw new Error('Edition inputs changed during navigation assembly');
  if(await readFile(join(output,'explore/catalog.json'),'utf8')!==json(catalog))throw new Error('Delivered exploration catalog changed during navigation assembly');
  const written=[];
  for(const [path,bytes]of [...rendered.outputs,...Object.entries(assets)]){
    if(await lstat(join(output,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}))throw new Error('Navigation output collision: '+path);
    await mkdir(dirname(join(output,path)),{recursive:true});await writeFile(join(output,path),bytes,{flag:'wx'});written.push({path,sha256:hash(bytes)});
  }
  const replacements=[];
  if(rendered.retainedCount){
    const targets=Object.keys(before).filter(p=>p==='index.html'||p==='ideas/index.html'||/^ideas\/collections\/[^/]+\/index\.html$/.test(p)||p.startsWith('explore/')&&p.endsWith('/index.html'));
    for(const path of targets){const original=await readFile(join(output,path),'utf8'),adapted=attachDomainNavigation(path,original,rendered.domains);if(original!==adapted){await writeFile(join(output,path),adapted);replacements.push({path,beforeSha256:hash(original),afterSha256:hash(adapted)});}}
  }
  if(mode==='release'&&rendered.canonicalPaths.length){
    const path='sitemap.xml',original=await readFile(join(output,path),'utf8');if(original.split('</urlset>').length!==2)throw new Error('Unknown sitemap structure');
    const esc=v=>v.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    const adapted=original.replace('</urlset>',rendered.canonicalPaths.map(p=>`<url><loc>${esc(base+p)}</loc></url>`).join('')+'</urlset>');await writeFile(join(output,path),adapted);replacements.push({path,beforeSha256:hash(original),afterSha256:hash(adapted)});
  }
  const after=await inventory(output),allowed=new Set(replacements.map(r=>r.path));
  for(const [path,digest]of Object.entries(before))if(!allowed.has(path)&&after[path]!==digest)throw new Error('Unrelated candidate changed: '+path);
  const finalBinding=await navigationBinding(prepared.data);if(finalBinding.digest!==binding.digest)throw new Error('Navigation inputs changed during assembly');
  const report={schemaVersion:1,mode,canonicalBase:base,acceptedLegacyCommit:predecessor.acceptedLegacyCommit,legacyIdeas:predecessor.legacyIdeas,sourceCatalogVersion:prepared.data.catalog.catalogVersion,sourceContentDigest:verification.contentDigest,sourceArtifactDigest:verification.artifactDigest,navigationDigest:binding.digest,navigationFiles:binding.files,editionDeliveryDigest:binding.editionDeliveryDigest,liveOrientations:rendered.liveCount,retainedOrientations:rendered.retainedCount,distinctExplorations:rendered.editionIds.length,canonicalOrientationPages:rendered.canonicalPaths.length,generatedFiles:written,replacements,generatedDigest:hash(json({written,replacements})),preexistingFilesPreserved:Object.keys(before).length-replacements.length,scope:'Local cumulative navigation candidate only. Predecessor build reports describe their stages before these explicit link additions. No deployment, new lesson acceptance, fresh remote source review or private-store writes.'};
  await writeFile(join(output,'navigation-build.json'),json(report));return {...report,output};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2),options={};while(args.length){const flag=args.shift();if(flag==='--out')options.out=args.shift();else if(flag==='--mode')options.mode=args.shift();else if(flag==='--base-url')options.base=args.shift();else throw new Error('Unknown argument '+flag);}console.log(json(await buildDomainNavigation(options)));}catch(e){console.error(e.message);process.exitCode=1;}
}
