import { test } from 'node:test';
import assert from 'node:assert/strict';
import basic from '../content/graph/ch01.js';
import drawing from '../content/graph/ch04-z.js';
import { ix, longestCycle, named } from '../content/graph/ch01.shared.js';
import { allCycles, cyclesToBonds, isBondMask, dualOf } from '../content/graph/ch04-z.shared.js';
import { masksOf, full, listColour, chiOf } from '../content/graph/ch05-z.shared.js';
const graph=(n,E)=>({nodes:Array.from({length:n},(_,id)=>({id,x:id,y:0})),edges:E});
const cycle=n=>Array.from({length:n},(_,i)=>[i,(i+1)%n]);

// A small graph-kit stub executes the actual picture's readout; it does not
// reconstruct the display formula in the test.
function mountReadout(item){
 const graphs=[];let read;
 const stage=new Proxy({}, {get:()=>()=>{}});
 const v={stage:()=>stage,select:(_,o,value)=>({value,el:{}}),legend(){},render(){},readout(fn){read=fn;},
  graph(_,spec){const g={...spec,set(spec){Object.assign(this,spec);return this;},layout(){return this;},draw(){}};graphs.push(g);return g;}};
 item.viz(v);return {graphs,read:()=>read()};
}

test('capped longest-cycle search is a lower bound and the actual readout leaves Hamiltonicity undecided',()=>{
 // Two dense nine-vertex blocks joined by a bridge have circumference nine.
 // Their many non-Hamiltonian paths exhaust the work cap.
 const E=[];for(let b=0;b<2;b++)for(let i=0;i<9;i++)for(let j=i+1;j<9;j++)E.push([9*b+i,9*b+j]);E.push([8,9]);
 const G=graph(18,E),r=longestCycle(ix(G));assert.equal(r.exact,false);assert.equal(r.cycle.length,9);
 const m=mountReadout(basic.items.find(x=>x.num==='1.3.1b'));m.graphs[0].set(G);
 assert.match(m.read(),/at least.*9/);assert.match(m.read(),/Hamiltonicity undecided/);assert.doesNotMatch(m.read(),/not Hamiltonian/);
});

test('list size below chromatic index can still admit a colouring when lists differ',()=>{
 // L(C5)=C5, so this is equally an edge-list example. Each list has two
 // colours, yet their union has ten; selecting its unique first colour works.
 const A=masksOf(5,cycle(5)),S=full(5);assert.equal(chiOf(A,S),3);
 assert.equal(listColour(A,S,Array(5).fill(3)),null);
 const L=Array.from({length:5},(_,i)=>(1<<i)|(1<<(i+5))),col=listColour(A,S,L);
 assert.ok(col&&!col.timeout);for(const [a,b]of cycle(5))assert.notEqual(col[a],col[b]);
 assert.deepEqual(listColour(A,S,L,0),{timeout:true});
});

test('K4 has many valid abstract self-dual pairings, not just the literal opposite-edge pairing',()=>{
 const H=ix(named('complete',4)),E=H.E.map(([a,b])=>[a,b]);
 const index=(a,b)=>E.findIndex(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
 const opposite=E.map(([a,b])=>{const [c,d]=[0,1,2,3].filter(x=>x!==a&&x!==b);return index(c,d);});
 const swap=[1,0,2,3],other=opposite.map(k=>index(swap[E[k][0]],swap[E[k][1]]));
 assert.notDeepEqual(other,opposite);
 for(const pi of [opposite,other])assert.equal(cyclesToBonds(H,{n:4,ends:E},pi,allCycles(H)),null);
 assert.ok(cyclesToBonds(H,{n:4,ends:E},E.map((_,k)=>k),allCycles(H)));
});

test('a bridge becomes a dual loop and the primal cycle becomes the complete three-edge bond',()=>{
 const H=ix(graph(4,[[0,1],[1,2],[2,0],[2,3]]));
 const D=dualOf(H,[[0,1,2],[0,2,3,2,1]]);assert.equal(D.nf,2);
 assert.equal(D.edges[3].a,D.edges[3].b);
 const ends=D.edges.map(e=>[e.a,e.b]),F=Uint8Array.from([1,1,1,0]);assert.ok(isBondMask(2,ends,F));
 for(let k=0;k<3;k++){const smaller=F.slice();smaller[k]=0;assert.equal(isBondMask(2,ends,smaller),false);}
 assert.equal(isBondMask(2,ends,Uint8Array.from([0,0,0,1])),false);
});

test('the spherical source definition allows an outer-face change and retains the cycle exception',()=>{
 // On the sphere a cycle has two complementary discs; either pairing of
 // its faces preserves every vertex/edge incidence, hence two extensions.
 const incidences=[[1,1,1],[1,1,1]];
 for(const pairing of [[0,1],[1,0]])for(let i=0;i<2;i++)assert.deepEqual(incidences[i],incidences[pairing[i]]);
 const def=drawing.items.find(x=>x.num==='4.3.1a').statement,thm=drawing.items.find(x=>x.num==='4.3.1').statement;
 assert.match(def,/homeomorphism of \$S\^2\$/);assert.match(thm,/unique if and only if the graph is not a cycle/);
});

test('the actual four-colour diagram marks every conflicting current kit edge in red',async()=>{
 const ch=(await import('../content/graph/ch05-a.js')).default,item=ch.items.find(i=>i.num==='5.1.1');
 const renders=[],graphs=[];let read;
 const stage=new Proxy({}, {get:()=>()=>{}});
 const v={stage:()=>stage,slider:()=>({value:12}),select:()=>({value:'3'}),button(){},legend(){},fix:(x,n)=>x.toFixed(n),render:fn=>renders.push(fn),readout:fn=>read=fn,
  graph(_,spec){const g={...spec,set(spec){this.nodes=spec.nodes;this.edges=spec.edges.map(e=>Array.isArray(e)?{from:e[0],to:e[1]}:e);return this;},layout(){return this;},draw(opts){this.options=opts;}};graphs.push(g);return g;}};
 item.viz(v);renders[0]();const g=graphs[0],reds=g.edges.filter(e=>g.options.edgeColor(e)==='red');
 assert.ok(reds.length>0);const number=Number(read().match(/leaves \$(\d+)\$/)[1]);assert.equal(reds.length,number);
});
