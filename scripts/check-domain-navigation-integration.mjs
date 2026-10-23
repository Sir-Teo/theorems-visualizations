// Replay the unchanged notebook package, then apply exactly the additive navigation delta.
import {readFile,writeFile,mkdir,lstat,readdir,symlink} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {ROOT} from './lib.mjs';
import {rehearseNotebooks} from './check-notebook-integration.mjs';
import {hash,json} from './domain-navigation.mjs';
const predecessor='83ad6c31a3982f3722d7b5550188c1d85668c087';
const additions=[
  'docs/architecture/domain-navigation.md','docs/integration/domain-navigation.json','docs/integration/domain-navigation.md',
  'docs/verification/universal-domain-navigation-ai-code.md','docs/verification/universal-domain-navigation-ai-content.md','docs/verification/universal-domain-navigation.md',
  'navigation/filter.mjs','navigation/releases.json','navigation/style.css','navigation/ui.mjs',
  'scripts/build-domain-navigation.mjs','scripts/check-domain-navigation-integration.mjs','scripts/domain-navigation.mjs',
  'tests/domain-navigation-ui.test.mjs','tests/domain-navigation.test.mjs'
].sort();
async function inventory(root,prefix=''){
  const files={};for(const e of await readdir(join(root,prefix),{withFileTypes:true})){
    if(e.name==='node_modules'&&!prefix)continue;
    const p=prefix?prefix+'/'+e.name:e.name;
    if(e.isDirectory())Object.assign(files,await inventory(root,p));else if(e.isFile())files[p]=hash(await readFile(join(root,p)));else throw new Error('Nonregular snapshot path: '+p);
  }return files;
}
const exists=path=>lstat(path).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
export async function rehearseDomainNavigation({repo,base,canonicalBase,ui=false}){
  if(!repo||!base||!canonicalBase)throw new Error('Explicit --repo, --base and --base-url are required.');
  const manifest=JSON.parse(await readFile(join(ROOT,'docs/integration/domain-navigation.json'),'utf8'));
  if(manifest.schemaVersion!==1||manifest.mode!=='domain-navigation-delta'||manifest.predecessorCommit!==predecessor||!Array.isArray(manifest.replacements)||manifest.replacements.length||!Array.isArray(manifest.additions)||manifest.additions.slice().sort().join('\n')!==additions.join('\n'))throw new Error('Unknown domain navigation integration manifest.');
  // The notebook checker pins its own predecessor. Check its complete delta against this checkpoint too.
  const priorManifest=JSON.parse(execFileSync('git',['show',predecessor+':docs/integration/exploration-notebooks.json'],{cwd:ROOT,encoding:'utf8'}));
  const pinnedPaths=[...new Set([...priorManifest.additions,...priorManifest.replacements.map(r=>r.path)])];
  for(const path of pinnedPaths){const expected=execFileSync('git',['show',predecessor+':'+path],{cwd:ROOT});if(hash(await readFile(join(ROOT,path)))!==hash(expected))throw new Error('Notebook predecessor differs: '+path);}
  const prior=await rehearseNotebooks({repo,base,canonicalBase,ui:false});
  const priorReport=JSON.parse(await readFile(prior.report,'utf8')),snapshot=priorReport.snapshot,logs=dirname(prior.report),before=await inventory(snapshot),changes=[];
  for(const path of manifest.additions){
    if(!(await lstat(join(ROOT,path))).isFile())throw new Error('Navigation addition must be regular: '+path);
    if(await exists(join(snapshot,path)))throw new Error('Navigation addition already exists: '+path);
    const bytes=await readFile(join(ROOT,path));await mkdir(dirname(join(snapshot,path)),{recursive:true});await writeFile(join(snapshot,path),bytes,{flag:'wx'});changes.push({path,action:'add',sha256:hash(bytes)});
  }
  const preview=join(logs,'domain-navigation-preview'),release=join(logs,'domain-navigation-empty-release'),checks=[];
  async function run(args,label){
    const log=join(logs,'domain-navigation-'+label+'.log');try{
      const output=execFileSync(process.execPath,args,{cwd:snapshot,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,
        ATLAS_DOMAIN_NAVIGATION_CANDIDATE:preview,ATLAS_EDITION_CANDIDATE:preview,ATLAS_NOTEBOOK_CANDIDATE:preview,
        ATLAS_DOMAIN_NAVIGATION_SCREENSHOTS:join(logs,'domain-navigation-screenshots'),ATLAS_EDITION_SCREENSHOTS:join(logs,'domain-navigation-edition-screenshots'),ATLAS_NOTEBOOK_SCREENSHOTS:join(logs,'domain-navigation-notebook-screenshots')}});
      await writeFile(log,output);checks.push({command:'node '+args.join(' '),result:'PASS',log});
    }catch(e){await writeFile(log,String(e.stdout||'')+String(e.stderr||''));throw new Error('Domain navigation check failed; inspect '+log);}
  }
  await run(['scripts/build-domain-overviews.mjs','--check'],'orientation-source');
  await run(['--test','tests/domain-navigation.test.mjs'],'offline');
  await run(['scripts/build-domain-navigation.mjs','--out',preview],'preview');
  await run(['scripts/build-domain-navigation.mjs','--mode','release','--base-url',canonicalBase,'--out',release],'empty-release');
  const previewBuild=JSON.parse(await readFile(join(preview,'navigation-build.json'),'utf8')),releaseBuild=JSON.parse(await readFile(join(release,'navigation-build.json'),'utf8'));
  if(previewBuild.liveOrientations!==30||previewBuild.distinctExplorations!==4||previewBuild.canonicalOrientationPages)throw new Error('Preview navigation scope differs.');
  if(releaseBuild.liveOrientations||releaseBuild.retainedOrientations||releaseBuild.distinctExplorations||releaseBuild.canonicalOrientationPages||releaseBuild.generatedFiles.length||releaseBuild.replacements.length)throw new Error('Empty release leaked domain content or navigation.');
  if(await exists(join(release,'domains'))||await exists(join(release,'assets/domain-navigation')))throw new Error('Empty release leaked domain paths.');
  if((await readFile(join(release,'sitemap.xml'),'utf8')).includes('/domains/')||(await readFile(join(release,'index.html'),'utf8')).includes('href="domains/"'))throw new Error('Empty release leaked domain links.');
  if(ui){await symlink(join(ROOT,'node_modules'),join(snapshot,'node_modules'),'dir');await run(['--test','--test-concurrency=1','tests/domain-navigation-ui.test.mjs','tests/exploration-editions-ui.test.mjs','tests/notebooks-ui.test.mjs'],'native');}
  for(const [path,digest]of Object.entries(before))if(hash(await readFile(join(snapshot,path)))!==digest)throw new Error('Preexisting snapshot changed: '+path);
  const report={result:'PASS',baseCommit:priorReport.baseCommit,predecessorCommit:predecessor,predecessorReport:prior.report,snapshot,preview,release,preexistingFilesPreserved:Object.keys(before).length,changes,previewBuild,releaseBuild,checks,scope:'Local additive domain-navigation candidate. No source-orientation edits, new lesson acceptance, real distribution decisions, deployment, private-store writes or active Wave checkout edits.'};
  const path=join(logs,'domain-navigation-report.json');await writeFile(path,json(report));return{result:'PASS',report:path,preview,release};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2),o={};while(args.length){const flag=args.shift();if(flag==='--ui')o.ui=true;else if(flag==='--base-url')o.canonicalBase=args.shift();else if(['--repo','--base'].includes(flag))o[flag.slice(2)]=args.shift();else throw new Error('Unknown argument '+flag);}console.log(json(await rehearseDomainNavigation(o)));}catch(e){console.error(e.message);process.exitCode=1;}
}
