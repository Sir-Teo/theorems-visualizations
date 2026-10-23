import { readFile, writeFile, mkdir, lstat, readdir } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib.mjs';
import { buildStaticIdeas } from './build-static-ideas.mjs';
import { DELIVERY_CODE, sha, jsonBytes, validateBundle, bundleKey, resolveReleases, renderEditions } from './exploration-editions.mjs';
import { canonicalBase } from './static-ideas.mjs';
import { esc } from '../explorations/render.mjs';

export async function loadEditionArchive(root=ROOT) {
  const manifest=JSON.parse(await readFile(join(root,'editions/manifest.json'),'utf8'));
  if(manifest?.schemaVersion!==1||!Array.isArray(manifest.bundles))throw new Error('Invalid edition manifest');
  const bundles=new Map(),runtimes=new Map();
  for(const entry of manifest.bundles) {
    if(!/^editions\/bundles\/x-[a-z][a-z0-9-]*-[0-9]{4}\/(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.json$/.test(entry?.path||''))throw new Error('Unsafe edition path');
    const key=bundleKey(entry.id,entry.revision);if(bundles.has(key))throw new Error('Duplicate retained edition');
    const bytes=await readFile(join(root,entry.path),'utf8');if(sha(bytes)!==entry.sha256)throw new Error('Frozen edition file hash changed');
    const bundle=JSON.parse(bytes);if(!/^[a-f0-9]{64}$/.test(bundle.runtimeDigest||''))throw new Error('Invalid frozen runtime identity');
    if(!runtimes.has(bundle.runtimeDigest))runtimes.set(bundle.runtimeDigest,JSON.parse(await readFile(join(root,'editions/runtimes',bundle.runtimeDigest+'.json'),'utf8')));
    validateBundle(bundle,runtimes.get(bundle.runtimeDigest),entry);
    bundles.set(key,{entry,bundle});
  }
  return {manifest,bundles,runtimes};
}
export async function deliveryBinding(root=ROOT) {
  const files=Object.fromEntries(await Promise.all(DELIVERY_CODE.map(async p=>[p,sha(await readFile(join(root,p)))])));
  for(const path of ['index.html','.nojekyll'])files[path]=sha(await readFile(join(root,path)));
  for(const path of ['assets','content','data'])Object.assign(files,await inventory(root,path));
  // These two nonsemantic timestamps change on every predecessor build. All other bytes bind exactly.
  for(const path of ['data/index.json','data/home.json']){const data=JSON.parse(await readFile(join(root,path),'utf8'));delete data.generated;files[path]=sha(JSON.stringify(data));}
  const sorted=Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)));
  return {files:sorted,digest:sha(jsonBytes(sorted))};
}
async function inventory(root,prefix='') {
  const files={};
  for(const name of (await readdir(join(root,prefix))).sort()) {
    const path=prefix?prefix+'/'+name:name,s=await lstat(join(root,path));
    if(s.isDirectory())Object.assign(files,await inventory(root,path));
    else if(s.isFile())files[path]=sha(await readFile(join(root,path)));
    else throw new Error('Nonregular candidate output');
  }
  return files;
}
export async function buildEditions({out,mode='preview',base=null}={}) {
  if(!['preview','release'].includes(mode))throw new Error('Use preview or release mode');
  if(mode==='preview'&&base)throw new Error('Preview assembly cannot receive a public base URL');
  base=canonicalBase(base);if(mode==='release'&&!base)throw new Error('Release assembly needs --base-url');
  const [{bundles,runtimes},binding]=await Promise.all([loadEditionArchive(),deliveryBinding()]);
  const ledger=JSON.parse(await readFile(join(ROOT,'editions/releases.json'),'utf8'));
  const readEvidence=path=>{const real=realpathSync(join(ROOT,path));if(!real.startsWith(realpathSync(ROOT)+'/'))throw new Error('Release evidence escapes checkout');return readFileSync(real,'utf8');};
  const entries=mode==='preview'?[...bundles.values()].map(value=>({...value,state:'preview'})):resolveReleases(ledger,bundles,{deliveryDigest:binding.digest,base,readEvidence});
  const rendered=renderEditions(entries,runtimes,{mode,base});
  // The predecessor enforces the accepted legacy inventory and exclusive new output directory.
  const legacy=await buildStaticIdeas({out,base}),output=legacy.output,before=await inventory(output);
  for(const [path,bytes]of rendered.outputs) {
    if(await lstat(join(output,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}))throw new Error('Unexpected delivery output collision: '+path);
    await mkdir(dirname(join(output,path)),{recursive:true});await writeFile(join(output,path),bytes,{flag:'wx'});
  }
  let index=await readFile(join(output,'index.html'),'utf8');
  if(index.split('<a href="ideas/">Read</a>').length!==2)throw new Error('Unknown static candidate navigation');
  index=index.replace('<a href="ideas/">Read</a>','<a href="ideas/">Read</a>\n      <a href="explore/">Explore</a>');
  await writeFile(join(output,'index.html'),index);
  if(base&&rendered.canonicalPaths.length) {
    let sitemap=await readFile(join(output,'sitemap.xml'),'utf8');
    if(sitemap.split('</urlset>').length!==2)throw new Error('Unknown legacy sitemap');
    sitemap=sitemap.replace('</urlset>',rendered.canonicalPaths.map(p=>`  <url><loc>${esc(base+p)}</loc></url>`).join('\n')+'\n</urlset>');
    await writeFile(join(output,'sitemap.xml'),sitemap);
  }
  const after=await inventory(output),allowed=new Set(['index.html',...(base&&rendered.canonicalPaths.length?['sitemap.xml']:[])]);
  for(const [path,digest]of Object.entries(before))if(!allowed.has(path)&&after[path]!==digest)throw new Error('Legacy candidate file changed: '+path);
  const report={schemaVersion:1,mode,canonicalBase:base,acceptedLegacyCommit:legacy.acceptedCommit,legacyIdeas:legacy.items,currentExplorations:rendered.currentCount,retainedEditions:rendered.retainedEditionCount,runtimes:rendered.runtimes,canonicalExplorationPages:rendered.canonicalPaths.length,deliveryDigest:binding.digest,deliveryFiles:binding.files,bundles:entries.map(e=>({id:e.bundle.id,revision:e.bundle.revision,sha256:e.entry.sha256,state:e.state})),generatedDigest:sha(jsonBytes(Object.fromEntries([...rendered.outputs].map(([p,bytes])=>[p,sha(bytes)])))),preexistingFilesPreserved:Object.keys(before).length-allowed.size,intentionalLegacyChanges:[...allowed],scope:mode==='preview'?'Local delivery preview only. No public release, new acceptance or note migration.':'Local assembly from explicit release decisions only. This command does not deploy or authorize deployment.'};
  await writeFile(join(output,'edition-build.json'),jsonBytes(report));
  return {...report,output};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const args=process.argv.slice(2),options={};while(args.length){const flag=args.shift();if(flag==='--out')options.out=args.shift();else if(flag==='--mode')options.mode=args.shift();else if(flag==='--base-url')options.base=args.shift();else throw new Error('Unknown argument: '+flag);}console.log(jsonBytes(await buildEditions(options)));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
