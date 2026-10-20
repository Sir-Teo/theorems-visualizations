import {PERFECT_HASH_PRIME,PERFECT_HASH_BUDGET,drawAffineAudit,affineHashAudit,expectedPerfectSpaceAudit,buildPerfectHashAudit,perfectLookupAudit} from './perfect-hashing-audit.shared.js';

export default {
      num: '5.18',
      kind: 'Theorem',
      name: 'Perfect hashing: O(1) worst-case lookups in O(n) space',
      statement: String.raw`A static set of $n$ keys can be stored in $O(n)$ space so that every lookup takes $O(1)$ time in the worst case (two hash evaluations and two memory probes). The **two-level scheme** of Fredman, Komlós and Szemerédi hashes the keys into $m=n$ buckets with $h$ from a universal family; bucket $j$, holding $b_j$ keys, gets its own table of $b_j^2$ slots and a function $h_j$ from a universal family with no collision among those keys. With $h$ redrawn until $\sum_j b_j^2<4n$ and each $h_j$ redrawn until collision-free, the expected number of draws is constant at both levels, and the expected construction time is $O(n)$.`,
      idea: String.raw`Into $b^2$ slots, $b$ keys collide with expected count $\binom b2\frac1{b^2}<\frac12$ by universality (5.16), so by Markov's inequality a random $h_j$ is collision-free with probability more than $\frac12$. For the first level, $\sum_j b_j^2=n+2\cdot\#\{\text{colliding pairs}\}$ has expectation at most $n+n(n-1)/m<2n$ when $m=n$ (5.17), so $\Pr[\sum b_j^2\ge4n]<\frac12$. Each level therefore succeeds after fewer than two draws on average.

Markov's inequality (prob-1.6.4) is the step from small expected counts to a likely usable table. For the nonnegative integer collision count $C$, $\Pr(C\ge1)\le EC<1/2$. For nonnegative first-level space $S=\sum_j b_j^2$, $\Pr(S\ge4n)\le ES/(4n)<1/2$. Independent fresh function choices therefore give geometric retries with success probability greater than one half. Universality gives an upper bound on $ES$, not necessarily the exact value $2n-1$ for every family and key set.`,
      caption: String.raw`Choose the key count and draw mode. Each row shows a first-level bucket and its second-level slots; click an occupied slot or use **Next key lookup** after the complete construction succeeds. **Redraw first level** retries with a new deterministic seed, and **New keys** changes the stored set. The histogram uses 3000 independent pseudorandom first-level draws for that set. Its sample mean, the concrete affine family's exact expectation and the universal upper bound are distinct. Repeating a bad family member deliberately breaks the independent-draw assumption: exhaustion is shown and lookup stays disabled.`,
      deps: ['algo-5.16', 'algo-5.17', 'prob-1.6.4'],
      refs: ['Erickson notes: Hashing'],
      credit: 'Fredman, Komlós & Szemerédi, 1984',
      tags: ['hashing'],
      scope: String.raw`The theorem describes independently drawn universal functions and unbounded retries. This illustration stops after 51 attempts at each level and certifies a table only if the first-level space test and every second-level collision test pass. Exhaustion is an unfinished construction, not a failed theorem or a perfect table. Keys are distinct integers 10–99; the affine family uses prime 1000003. Its exact space expectation follows from the uniform ordered distinct residue pair, while the histogram is a 3000-draw estimate. Saved state includes keys, seeds and selected lookup; no hash table is trusted merely because it was restored.`,
      viz(v) {
        const p=PERFECT_HASH_PRIME;let keySeed=8,attemptSeed=8,keys=[],look=null,build=null,buildKey='';
        const generate=()=>{const rng=v.rng(keySeed),out=new Set();while(out.size<nS.value)out.add(10+Math.floor(rng()*90));keys=[...out];look=null;};
        const bump=x=>(x+1)>>>0;
        const nS=v.slider('keys $n$',6,16,12,{int:true,onChange:()=>{keySeed=bump(keySeed);generate();}});
        const mode=v.select('function draws',[{value:'random',label:'independent'},{value:'first-collisions',label:'repeat bad first level'},{value:'bucket-collisions',label:'repeat bad bucket draw'}],'random',{onChange:()=>{look=null;}});
        generate();
        const current=()=>{const key=JSON.stringify([keys,attemptSeed,mode.value]);if(key!==buildKey){build=buildPerfectHashAudit(keys,v.rng(attemptSeed),{mode:mode.value});buildKey=key;}return build;};
        v.button('Redraw first level',()=>{attemptSeed=bump(attemptSeed);look=null;});
        v.button('New keys',()=>{keySeed=bump(keySeed);attemptSeed=bump(attemptSeed);generate();});
        const next=v.button('Next key lookup',()=>{if(current().perfect)look=keys[(keys.indexOf(look)+1)%keys.length];});
        const s=v.stage({x:[-4,24],y:[-.8,16],axes:false,height:400,minWidth:260,title:'buckets and second-level slots'});
        const Q=v.stage({x:[.1,5.5],y:[0,.5],axes:'box',gutter:true,height:330,minWidth:260,title:'first-level space / n: 3000 draws',xlabel:'space / n'});
        const cellWidth=()=>Math.min(1.6,21/Math.max(1,...current().rows.map(row=>row.keys.length**2)));
        s.onClick((x,y)=>{const B=current();if(!B.perfect)return;const j=Math.round(B.n-1-y),slot=Math.floor(x/cellWidth());if(j>=0&&j<B.n&&slot>=0&&slot<B.rows[j].slots.length&&B.rows[j].slots[slot]!==null)look=B.rows[j].slots[slot];});
        const histCache=new Map();let info=null;
        v.shareState('perfect hashing construction',{
          get:()=>({keys:[...keys],keySeed,attemptSeed,look}),
          validate:data=>data&&Array.isArray(data.keys)&&data.keys.length>=6&&data.keys.length<=16&&Array.from({length:data.keys.length},(_,i)=>Object.hasOwn(data.keys,i)&&Number.isInteger(data.keys[i])&&data.keys[i]>=10&&data.keys[i]<=99).every(Boolean)&&new Set(data.keys).size===data.keys.length&&['keySeed','attemptSeed'].every(k=>Number.isInteger(data[k])&&data[k]>=0&&data[k]<=4294967295)&&(data.look===null||data.keys.includes(data.look)),
          set:data=>{if(data.keys.length!==nS.value)throw new RangeError('Saved key count differs from control');keys=[...data.keys];keySeed=data.keySeed;attemptSeed=data.attemptSeed;look=data.look;if(look!==null&&!current().perfect)throw new RangeError('Unfinished hash construction cannot restore a lookup');}
        });
        v.render(()=>{
          const B=current(),w=cellWidth(),jLook=look===null?null:perfectLookupAudit(B,look);next.disabled=!B.perfect;
          s.setView([-4,24],[-.75,B.n+.2]);
          B.rows.forEach((row,j)=>{const y=B.n-1-j,hot=jLook?.bucket===j,col=row.status==='exhausted'||row.status==='blocked'?'red':hot?'gold':'muted';
            s.text(`${j}: ${row.keys.length}`, -3.7,y,{size:10.5,color:col,weight:700});
            if(row.status==='blocked'||row.status==='exhausted')s.text(row.status==='blocked'?'not built':'retry budget exhausted',.1,y,{size:10.5,color:'red',weight:600});
            else row.slots.forEach((key,i)=>{const selected=key!==null&&key===look;s.rect(i*w,y-.34,(i+1)*w,y+.34,{fill:selected?'gold':key===null?'panel':'accent',fillAlpha:selected?.6:key===null?1:.18,color:key===null?'faint':'accent',width:1});if(key!==null&&w*s.sx>16)s.text(String(key),(i+.5)*w,y,{align:'center',size:Math.min(11,w*s.sx*.45),weight:700,halo:false});});
          });
          const hk=keys.join(',');if(!histCache.has(hk)){const rng=v.rng(77),vals=[];for(let t=0;t<3000;t++){const counts=Array(B.n).fill(0);const [a,b]=drawAffineAudit(rng,p);keys.forEach(k=>counts[affineHashAudit(a,b,p,B.n,k)]++);vals.push(counts.reduce((z,x)=>z+x*x,0)/B.n);}if(histCache.size>32)histCache.clear();histCache.set(hk,vals);}
          const vals=histCache.get(hk),cnt=new Map();vals.forEach(x=>cnt.set(x,(cnt.get(x)||0)+1));const ymax=Math.max(...cnt.values())/vals.length*1.2,xmax=Math.max(5.5,...vals)+.3;Q.setView([.2,xmax],[0,ymax]);
          if(xmax>4)Q.vband(4,xmax,{color:'red',alpha:.06});
          for(const[x,count]of cnt)Q.rect(x-.045,0,x+.045,count/vals.length,{fill:x>=4?'red':'accent',fillAlpha:.6,stroke:false});
          const sample=vals.reduce((a,b)=>a+b,0)/vals.length,exact=expectedPerfectSpaceAudit(B.n,p),upper=2*B.n-1;
          Q.vline(sample,{color:'accent',width:2});Q.vline(exact/B.n,{color:'green',width:2});Q.vline(upper/B.n,{color:'muted',width:1.5,dash:true});Q.vline(4,{color:'red',width:1.5});
          info={B,sample,exact,upper,bad:vals.filter(x=>x>=4).length/vals.length,jLook};
        });
        v.legend([['accent','sample mean'],['green','exact affine-family expectation'],['muted','universal upper bound (nearly overlaps)',{dash:true}],['red','rejected first-level space ≥ 4n']]);
        v.readout(()=>{
          if(!info)return'';const{B,sample,exact,upper,bad,jLook}=info,failed=B.rows.filter(row=>row.status==='exhausted').length;
          const status=B.perfect?'**Perfect table accepted: lookup enabled.**':`**${B.status}: lookup disabled.**`;
          const lookup=look===null?'Select Next key lookup after success.':`Key ${look}: bucket ${jLook.bucket}, slot ${jLook.slot}; ${jLook.found?'found in two probes':'not found'}.`;
          return `${status} First level: ${B.firstDraws}/${PERFECT_HASH_BUDGET} draws, space ${B.space} ${B.firstAccepted?'<':'≥'} ${4*B.n}. ${failed?`${failed} bucket(s) exhausted their ${PERFECT_HASH_BUDGET}-draw budgets.`:''}\n${lookup}\nFor these ${B.n} distinct keys: exact family $E\\sum b_j^2=${v.fix(exact,6)}$; universal upper bound $2n-1=${upper}$. Sample mean over 3000 draws: ${v.fix(sample*B.n,3)}; observed retry fraction ${v.fix(bad,3)} (a sample, not a guaranteed inequality). ${mode.value==='random'?'Independent pseudorandom draws.':'Repeated-choice demonstration breaks the independent-draw hypothesis.'}`;
        });
      },
};
