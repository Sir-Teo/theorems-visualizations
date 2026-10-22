// Read a pinned Git snapshot; apply only the pilot package to a new temporary directory.
// Never writes to the source checkout, destination worktree or Git index.
import { readFile, writeFile, mkdir, mkdtemp, symlink, readdir, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ROOT } from './lib.mjs';
const hash = data => createHash('sha256').update(data).digest('hex');
const allowed = path => /^(explorations\/|labs\/atlas\/|docs\/(coverage\/|pilots\/|architecture\/universal-schema-urls\.md$|integration\/universal-pilots(?:-baseline-plan|-review-session)?\.(json|md)$|verification\/universal-pilots(?:-review|-integration|-methods|-studio|-ai-(?:history|literature|philosophy|agriculture|craft|performance|code))?\.md$|master-plan-(?:handoff|execution)\.md$|exploration-authoring\.md$|universal-(coverage|atlas-research)\.md$))/.test(path)
  || /^(MASTER_PLAN_V2_ARCHIVE\.md|scripts\/(build-explorations|validate-coverage|check-exploration-integration)\.mjs|tests\/(coverage-registry|explorations|exploration-methods|exploration-studio|explorations-ui|explorations-integration)\.test\.mjs|tests\/explorations-production\.mjs)$/.test(path);
export async function planOverlay(source, target, paths) {
  if (!Array.isArray(paths) || !paths.length || new Set(paths).size !== paths.length) throw new Error('Package paths must be unique');
  const plan=[];
  for(const path of paths) {
    if(typeof path !== 'string' || path.split('/').some(x=>!x || x==='.' || x==='..') || path.includes('\\') || !allowed(path)) throw new Error('Outside additive package: '+path);
    const stat=await lstat(join(source,path));
    if(!stat.isFile()) throw new Error('Package entry must be a regular file: '+path);
    const bytes=await readFile(join(source,path));
    const existing=await lstat(join(target,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(existing && (!existing.isFile() || hash(await readFile(join(target,path)))!==hash(bytes))) throw new Error('Destination differs; reconcile explicitly: '+path);
    plan.push({path,sha256:hash(bytes),action:existing?'identical':'add',bytes});
  }
  return plan;
}
async function inventory(root, relative='') {
  const entries=await readdir(join(root,relative),{withFileTypes:true}), result={};
  for(const e of entries) {
    const path=relative?relative+'/'+e.name:e.name;
    if(e.isDirectory()) Object.assign(result,await inventory(root,path));
    else if(e.isFile()) result[path]=hash(await readFile(join(root,path)));
    else throw new Error('Snapshot contains an unsupported special file: '+path);
  }
  return result;
}
export async function preflight({repo,base,ui=false}) {
  if(!repo || !base || base.startsWith('-')) throw new Error('Explicit --repo and --base are required; acceptance is not inferred from HEAD');
  const commit=execFileSync('git',['-C',resolve(repo),'rev-parse','--verify',base+'^{commit}'],{encoding:'utf8'}).trim();
  const temp=await mkdtemp(join(tmpdir(),'atlas-integration-')), target=join(temp,'snapshot');await mkdir(target);
  const archive=join(temp,'base.tar');
  execFileSync('git',['-C',resolve(repo),'archive','--format=tar','--output='+archive,commit]);
  execFileSync('tar',['-xf',archive,'-C',target]);
  const before=await inventory(target);
  const manifest=JSON.parse(await readFile(join(ROOT,'docs/integration/universal-pilots.json'),'utf8'));
  if(manifest.schemaVersion!==1 || manifest.mode!=='additive-local-preview' || manifest.manualReconcile?.join(',')!=='MASTER_PLAN.md') throw new Error('Unknown integration package contract');
  const plan=await planOverlay(ROOT,target,manifest.files);
  for(const {path,bytes} of plan){await mkdir(dirname(join(target,path)),{recursive:true});await writeFile(join(target,path),bytes);}
  const commands=[['scripts/validate-coverage.mjs'],['scripts/build-explorations.mjs','--check'],['--test','tests/coverage-registry.test.mjs','tests/explorations.test.mjs','tests/explorations-integration.test.mjs','tests/exploration-methods.test.mjs','tests/exploration-studio.test.mjs']];
  if(ui){await symlink(join(ROOT,'node_modules'),join(target,'node_modules'),'dir');commands.push(['--test','tests/explorations-ui.test.mjs']);}
  const checks=[];
  for(const args of commands){
    const log=join(temp,'check-'+(checks.length+1)+'.log');
    try {const output=execFileSync(process.execPath,args,{cwd:target,encoding:'utf8',maxBuffer:8*1024*1024,env:{...process.env,ATLAS_PILOT_SCREENSHOTS:join(temp,'screenshots')}});await writeFile(log,output);checks.push({command:'node '+args.join(' '),result:'PASS',log});}
    catch(e){await writeFile(log,String(e.stdout||'')+String(e.stderr||''));throw new Error('Integration check failed; inspect '+log+'\n'+e.message);}
  }
  const changed=[];
  for(const [path,digest] of Object.entries(before)) if(hash(await readFile(join(target,path)))!==digest)changed.push(path);
  if(changed.length)throw new Error('Base snapshot changed: '+changed.join(', '));
  const report={schemaVersion:1,mode:manifest.mode,baseCommit:commit,sourceRepo:resolve(repo),snapshot:target,baseFilesPreserved:Object.keys(before).length,files:plan.map(({bytes,...entry})=>entry),manualReconcile:manifest.manualReconcile,checks,scope:'Engineering preservation preflight only. Exact-version local AI reviews are separate receipts; professional/human observations and public release are not established by these checks. No active checkout was written.'};
  await writeFile(join(temp,'report.json'),JSON.stringify(report,null,2)+'\n');
  return {result:'PASS',baseCommit:commit,baseFilesPreserved:report.baseFilesPreserved,packageFiles:plan.length,report:join(temp,'report.json'),snapshot:target};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try {
    const args=process.argv.slice(2),options={};
    while(args.length){const flag=args.shift();if(flag==='--ui')options.ui=true;else if(['--repo','--base'].includes(flag))options[flag.slice(2)]=args.shift();else throw new Error('Unknown argument '+flag);}
    console.log(JSON.stringify(await preflight(options),null,2));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
