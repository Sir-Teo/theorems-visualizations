import {MELT,solidus,decompression} from './geol-source-audit-melting.js';
export default {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Decompression melting',
      statement: String.raw`Rising solid mantle follows an approximately adiabatic path, while the nominally dry peridotite solidus drops faster as pressure falls. Thus sufficiently hot material can cross the solidus and begin to melt during decompression, even without external heating. Melting consumes latent heat and changes both temperature and composition. The amount produced depends on source composition, volatiles, the pressure path and melt extraction; a solidus relation alone does not predict melt fraction or crustal thickness.`,
      idea: String.raw`The chosen illustration uses a solid adiabat $T_a=T_p+\Gamma P$, a polynomial solidus $T_s(P)$ and two constant temperature scales $L/c_p$ and $\Delta T_m$. Its assumed balance is $T_a-T_s=(L/c_p+\Delta T_m)F$, giving $T=T_a-(L/c_p)F$ and positive productivity per pressure drop $-dF/dP=(T_s'(P)-\Gamma)/(L/c_p+\Delta T_m)$. This is an illustrative linear melting closure, not a full isentropic petrological model. A lid deeper than the first crossing can stop the rise before any melting starts.`,
      caption: String.raw`Change potential temperature and the depth where ascent stops. The red solidus is the polynomial version explicitly printed in Hirschmann (2000)'s abstract: $T_s=1120.661+132.899P-5.104P^2$ (°C, GPa). The dashed red curve is a chosen 700 K offset, not a measured liquidus. Dashed blue: unmelted reference adiabat; solid blue: allowed melting interval; orange: chosen melt fraction up to the lid. Gold marks an actual onset along this path. Shading marks depths excluded by the lid. The entire onset/path is visible, including hot cases deeper than 4 GPa.`,
      deps: ['geol-4.7', 'pchem-4.3'],
      refs: ['Hirschmann (2000), complete original PDF pp.1–6 and20–24: Eq.1, Table2, §§6.4–7; abstract/Table2/paragraph39 conflict retained', 'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2000GC000070'],
      tags: ['melting', 'solidus', 'adiabat'],
      credit: 'Solidus polynomial version in Hirschmann (2000) abstract; chosen illustrative melting closure',
      scope: String.raw`The complete original publisher PDF was recovered; its abstract, Table 2 and §6.4 paragraph 39 themselves print conflicting coefficients, matching the current HTML. This picture uses exactly the abstract version, not a reconciled recommended fit. Table 2 instead prints $(-5.1404654,132.899012,1120.66061)$ and paragraph 39 $(-5.904,139.44,1108.08)$ for $(a,b,c)$ in $aP^2+bP+c$. The author's intended numerical fit remains unresolved. Nominally dry peridotite experiments have compositional and interlaboratory uncertainty. Chosen constants: $\Gamma=15$ K/GPa, $L/c_p=500$ K, $\Delta T_m=700$ K, mantle/crust densities 3300/2900 kg/m³, $g=9.8$ m/s². The displayed equivalent melt column $\int F\,dP/(\rho_c g)$ is the inventory implied by these chosen assumptions, not observed oceanic crust, and does not simulate fractional extraction, active focusing or freezing. Solidus pressure is restricted to the original 0–10 GPa experimental range; all displayed paths remain within it. The chosen linear adiabat and melting closure do not reproduce an original isentropic calculation or the nonlinear changes in productivity from evolving mineral modes/composition. Controls use 5°C temperature ticks and whole-kilometer lid depths; unsupported raw saved ticks reject before constraints.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Decompression_melting' },
      verify: true,
      viz(v) {
        const Tp = v.slider('potential temperature $T_p$ (°C)', 1200, 1650, 1350, { step: 5 });
        const lid = v.slider('lithospheric lid thickness (km)', 0, 100, 0, { step: 1 });
        for(const[c,lo,hi,step]of[[Tp,1200,1650,5],[lid,0,100,1]]){const set=c.set;c.set=x=>{if(!Number.isFinite(x)||x<lo||x>hi||x!==Math.round(x/step)*step)throw new RangeError('Saved melting control requires a supported tick');return set(x);};}
        const L=v.stage({x:[1000,2500],y:[-6.5,.2],axes:'box',gutter:true,xlabel:'temperature (°C)',ylabel:'pressure (GPa; downward)',height:360,full:true});
        const R=v.stage({x:[-1,50],y:[-200,5],axes:'box',gutter:true,xlabel:'melt fraction F (%)',ylabel:'depth (km)',height:360,full:true});
        let info = {};
        v.render(() => {
          const tp=Tp.value,Q=decompression(tp,lid.value),{P0,Pl,F}=Q,deep=Math.max(4.2,P0,Pl)*1.07;
          L.setView([Math.min(1000,tp-80),solidus(deep)+MELT.interval+80],[-deep*1.04,.3]);
          R.setView([-2,Math.max(30,100*Q.Fmax*1.12)],[-deep*Q.kmPerGPa*1.04,8]);
          const ticks=Array.from({length:Math.floor(deep)+1},(_,i)=>[-i,String(i)]);L.setTicks(null,ticks);
          L.curve(P=>[solidus(P),-P],0,deep,{n:160,color:'red',width:2.4});
          L.curve(P=>[solidus(P)+MELT.interval,-P],0,deep,{n:160,color:'red',width:1.2,dash:[3,3],alpha:.7});
          L.line(tp,0,tp+MELT.G*deep,-deep,{color:'accent',dash:true,width:1.6});
          if(!Q.nomelt){L.curve(P=>[Q.path(P),-P],Pl,P0,{n:100,color:'accent',width:2.6});L.dot(tp+MELT.G*P0,-P0,{r:5,color:'gold'});}
          const end=Q.nomelt?Pl:P0,pg=Array.from({length:160},(_,i)=>Pl+(end-Pl)*i/159);
          R.path(pg.map(P=>[100*F(P),-P*Q.kmPerGPa]),{color:'orange',width:2.4});
          if(Q.nomelt)R.corner('No melt along allowed ascent','tl');
          if(Pl>0){L.hband(-Pl,0,{color:'muted',alpha:.12});R.hband(-lid.value,0,{color:'muted',alpha:.25});}
          L.dot(tp,.0,{r:4,color:'accent',label:'$T_p$',labelPos:'n'});
          info=Q;
        });
        v.legend([['red', 'abstract polynomial version'], ['red', 'chosen solidus + 700 K', { dash: true }], ['accent', 'rising mantle path'], ['gold', 'melting begins', { dot: true }]]);
        v.readout(()=>info.nomelt?`Ascent stops at ${lid.value} km before reaching potential onset pressure $P_0=${v.fix(info.P0,3)}$ GPa (${v.fix(info.depth,1)} km): no melting along the allowed path.`:`Model onset $P_0=${v.fix(info.P0,3)}$ GPa (${v.fix(info.depth,1)} km); chosen melt fraction at the lid $${v.fix(100*info.Fmax,2)}\%$. Equivalent melt-column inventory $${v.fix(info.column,2)}$ km, not an observed crustal thickness.`);
      },
    };
