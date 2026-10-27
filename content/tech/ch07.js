import {techSteamViz} from './ch07.viz.js';
export default {
  collection:'tech', chapter:7,
  title:"Steam, iron and the Industrial Revolution",
  summary:String.raw`Steam machinery joins pressure, heat and constrained motion to materials and precision manufacture. The lessons distinguish surviving historical witnesses from authored quantitative mechanisms: no invented coal-consumption, forest-saving, productivity or steel-price series is used. Each interactive construction states the assumptions that make its forces, geometry or resource ledger meaningful.`,
  items:[
    {
      num:"7.1",
      kind:"Invention",
      name:"Savery’s and Papin’s steam devices",
      deps:["tech-6.11"],
      tags:["early-modern", "1698"],
      credit:"Savery and Papin, late seventeenth-century devices",
      refs:["Thurston 1886, selected Savery/Papin passages and original figures 12/17; historical commentary", "Written TECH6.11 hydrostatic pressure; own declared pressure/volume balance"],
      links:{"source": "https://www.gutenberg.org/files/35916/35916-h/35916-h.htm"},
      statement:String.raw`A steam receiver and an atmospheric piston use condensation in different ways. In Savery’s arrangement, condensing steam lowers receiver pressure so atmospheric pressure can lift water into it; fresh steam then pushes that water out. In Papin’s proposed piston arrangement, a raised piston is held while steam condenses, and the resulting pressure difference can drive its downward working stroke. Neither arrangement obtains an unlimited lift merely by making a better vacuum.

For water of density $\rho$, ambient pressure $p_a$ and condensed-vessel pressure $p_c$, the limiting static suction head is
$$h_s=\frac{p_a-p_c}{\rho g}.$$
The separate ideal discharge balance is $h_d=(p_s-p_a)/(\rho g)$ for steam pressure $p_s$.`,
      idea:String.raw`TECH6.11 supplies the liquid-column balance: integrate pressure through the water, then compare the vessel pressure with the free surface exposed to the atmosphere. The piston instead converts the same pressure difference into force $F=(p_a-p_c)A$ and, over a declared stroke $L$, work $FL$. These are distinct useful effects. A receiver above the available suction head cannot be filled by this ideal suction step, even when the later discharge pressure is high. The drawings separate the receiver valves from the piston and latch.`,
      caption:String.raw`Step through steam admission, condensation and the working stroke. Compare the receiver’s water path with the piston’s motion, then change ambient, condensed and discharge pressures. The head plot makes the suction ceiling visible; increasing discharge pressure moves only its own limit.`,
      scope:String.raw`Authored quasi-static pressure balances, not a reproduction of a measured Savery pump or Papin machine. Pressures are absolute kPa; water density 1000 kg/m³ and gravity 9.81 m/s² are declared constants. Pipes, leaks, steam generation, heating time, friction and dynamic valve losses are omitted. The schematic has no spatial scale; the head plot uses metres. A negative head denotes an unavailable positive lift, not a negative-height pump.`,
      viz(v){techSteamViz(v,1);}
    },
    {
      num:"7.2",
      kind:"Invention",
      name:"The Newcomen atmospheric engine",
      deps:["tech-7.1", "tech-2.1"],
      tags:["early-modern", "1712"],
      credit:"Newcomen atmospheric engine, practical installation 1712",
      refs:["Science Museum Group, Newcomen Atmospheric Engine, collection record; surviving example 1791", "Written TECH2.1 lever and TECH6.11 pressure balance; own thermal budget"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co50900/newcomen-atmospheric-engine"},
      statement:String.raw`The Newcomen engine admits low-pressure steam to a cylinder and then condenses it there. The atmosphere pushes the piston down; the rocking beam lifts the mine-pump rods on its other side. The Science Museum’s 1791 example represents this engine type, whose practical introduction is dated 1712 in its account. It is not a surviving 1712 original.

Let $r=L_p/L_e$ be pump-arm length divided by engine-arm length. An ideal beam gives pump force $F_p=F_e/r$ and pump stroke $s_p=rs_e$. For pump area $a$ and lift $H$, the static water load is $\rho gHa$.`,
      idea:String.raw`The lever trades force for distance rather than multiplying work. With piston force $(p_a-p_c)A$, compare the available pump force with the water load. If the load exceeds it, selecting a later drawing position does not make the engine capable of that stroke. To expose the cost of repeatedly cooling the cylinder, our separate heat ledger uses chosen steam density 0.6 kg/m³, latent heat 2257 kJ/kg and cylinder heat capacity 0.46 kJ/(kg·K): $Q=0.6 As_e(2257)+Mc\Delta T$. The active cylinder mass and temperature swing are inputs, not observations from the museum engine.`,
      caption:String.raw`Move the illustrated stroke and change the lever ratio, piston area or mine depth. The beam and force comparison reveal when the declared load is too large. The heat panel separately tallies steam condensation and cyclic cylinder reheating.`,
      scope:String.raw`Ideal lossless beam and single water-lift load; no acceleration, counterweight, friction or predicted cycle timing. The stroke control selects geometry, including an infeasible load case, rather than integrating motion. The pressure difference is against fixed 101.325 kPa ambient. The chosen heat ledger omits boiler losses and steam sensible heat; its work/heat fraction is an illustrative indicated fraction, not measured engine or overall fuel efficiency.`,
      viz(v){techSteamViz(v,2);}
    },
    {
      num:"7.3",
      kind:"Invention",
      name:"Coke smelting of iron (Darby)",
      deps:["tech-3.3"],
      tags:["industrial", "1709"],
      credit:"Abraham Darby I, coke smelting at Coalbrookdale 1709",
      refs:["English Heritage, History of Iron Bridge, selected Darby/coke and individually fitted casting passages", "Written TECH3.3 iron reduction; own mass and hypothetical resource accounting"],
      links:{"source": "https://www.english-heritage.org.uk/visit/places/iron-bridge/history/"},
      statement:String.raw`Coke, made from coal, could replace charcoal in iron smelting without requiring the same wood supply. English Heritage dates Abraham Darby I’s Coalbrookdale development to 1709. This changed a material and production system; it does not supply a universal historical fuel price, a measured forest area saved or a claim that every later iron component was interchangeable.

One balanced reduction step is
$$\mathrm{Fe_2 O_3+3 CO\to 2 Fe+3 CO_2}.$$
Its atom and mass ledger describes the reduction step, not the whole blast furnace’s heat and fuel balance.`,
      idea:String.raw`TECH3.3 distinguishes reduction of iron oxide from melting and refining. Using the declared rounded molar masses Fe 55.845, O 15.999 and C 12.011, the reaction fixes ore, CO and CO₂ masses for a chosen iron mass. Carbon contained in the consumed CO is not a complete estimate of furnace fuel. A separate explicitly chosen carbon budget $B$ needs fuel mass $B/f$ when its carbon fraction is $f$. Multiplying by an assumed price gives a scenario cost. For charcoal yield $y$ and a chosen wood yield $w$ per hectare, the hypothetical wood requirement is $(B/f)/y$ and area is that quantity divided by $w$.`,
      caption:String.raw`Switch the furnace fuel and inspect the balanced reduction ledger. Change the declared carbon budget, fuel prices and wood yield to compare hypothetical costs and wood requirements. A budget below the single-pass CO carbon content is identified rather than silently treated as sufficient.`,
      scope:String.raw`All prices use arbitrary currency units per kg; all carbon budgets, fuel fractions, charcoal yields and wood yields are authored scenario inputs. The hectare result is a hypothetical resource requirement, not an observed forest saving or environmental-impact estimate. Real furnaces also need heat, permeability, suitable coke strength, fluxes and gas recycling. The reduction ledger does not model those processes or predict furnace scale.`,
      viz(v){techSteamViz(v,3);}
    },
    {
      num:"7.4",
      kind:"Invention",
      name:"The cylinder-boring machine (Wilkinson)",
      deps:["tech-7.3"],
      tags:["industrial", "1774"],
      credit:"Wilkinson cylinder boring, mill attribution c. 1775",
      refs:["Science Museum Group, Cast iron boring bar and boring head, collection record; alleged Bersham provenance retained", "Own Euler–Bernoulli beam comparison with explicitly different supports and load positions"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co46448"},
      statement:String.raw`A steam cylinder needs a sufficiently regular bore for its piston and seal. Supporting a boring bar reduces elastic movement under a cutting load and helps make this possible. The Science Museum’s c. 1775 bar record connects precision boring with Boulton and Watt’s engines, while qualifying the surviving object’s Bersham provenance as alleged.

For an ideal circular bar with $I=\pi d^4/64$, an end-loaded cantilever has maximum deflection $PL^3/(3 EI)$. A simply supported bar carrying a central point load has maximum deflection $PL^3/(48 EI)$.`,
      idea:String.raw`Both formulae follow from integrating the small-deflection relation $EIy''=M(x)$ with their own support conditions. The first bar is fixed at one end and loaded at the free end. The second rests at both ends and is loaded at its centre; its deflection is symmetric and zero at both supports. Their maximum-deflection ratio is 16 at equal span, load and stiffness, but their load positions and supports differ. Since $I$ scales as diameter to the fourth power, doubling diameter divides these ideal deflections by 16. A real cutting machine has additional sources of error.`,
      caption:String.raw`Choose the bar span, diameter and cutting load. Compare the two drawn support arrangements with their actual deflection curves in millimetres, then inspect diameter sensitivity. The highlighted deflection is magnified in the machine sketch and remains quantitatively labelled.`,
      scope:String.raw`Uniform elastic Euler–Bernoulli bars, small deflections, static point loads, declared modulus in GPa and circular sections. Bearing compliance, distributed cutting forces, vibration, wear and thermal distortion are omitted. The sketches are explanatory alternatives, not an exact reconstruction of Wilkinson’s machine. Deflection is not automatically bore out-of-roundness or leakage, and no historical shilling-thickness measurement is inferred.`,
      viz(v){techSteamViz(v,4);}
    },
    {
      num:"7.5",
      kind:"Invention",
      name:"Watt’s separate condenser",
      deps:["tech-7.2", "tech-7.4"],
      tags:["industrial", "1769"],
      credit:"Watt separate condenser; surviving Lap engine 1788",
      refs:["Science Museum Group, Lap engine 1788, mechanism description", "Written TECH7.2 chosen thermal budget, reused unchanged; no historical fuel calibration"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co50948/rotative-steam-engine-by-boulton-and-watt-1788"},
      statement:String.raw`Watt’s separate condenser gives steam a cold place to condense while the working cylinder can remain hot. Condensation still disposes of heat; the improvement avoids repeatedly cooling and reheating so much of the cylinder itself. The surviving 1788 Lap engine illustrates this arrangement.

For our declared stroke volume $V$, active metal mass $M$, heat capacity $c$ and temperature swing $\Delta T$, compare
$$\begin{gathered}
Q_{\rm inside}=Q_s+Mc\Delta T,\\
Q_{\rm separate}=Q_s+fMc\Delta T.
\end{gathered}$$
The chosen fraction $f$ represents residual cyclic reheating, not a measured Watt-engine parameter.`,
      idea:String.raw`The same pressure difference and swept volume give the same ideal indicated work $W=(p_a-p_c)V$ in both cases. The comparison therefore isolates a heat-budget change rather than adding work without accounting for its source. The shared latent term is $Q_s=0.6 V(2257)$kJ, as in 7.2. The saving fraction is $(1-f)Mc\Delta T/Q_{\rm inside}$: it is zero when the cylinder temperature swing is zero or when $f=1$. Its value changes with the selected metal mass and stroke volume, so one setting cannot certify a universal historical coal-saving ratio.`,
      caption:String.raw`Switch between condensation in the cylinder and in a separate vessel. Follow the hot and cold paths, compare the two heat ledgers, and move the residual-reheating fraction. The work marker stays tied to the same pressure-volume balance.`,
      scope:String.raw`A chosen two-term heat ledger, not a full thermodynamic engine cycle or empirical fuel model. Steam density, latent heat and cylinder heat capacity are the declared teaching constants from 7.2. Boiler efficiency, heat leaks, expansion, air-pump work and changing material properties are omitted. All savings refer to these declared input-heat totals; no measured coal consumption or universally fixed improvement is claimed.`,
      viz(v){techSteamViz(v,5);}
    },
    {
      num:"7.6",
      kind:"Invention",
      name:"The rotative engine: sun-and-planet gear and governor",
      deps:["tech-7.5", "tech-2.10", "ctrl-1.2"],
      tags:["industrial", "1781"],
      credit:"Watt rotative machinery; surviving governed example 1788",
      refs:["Science Museum Group, Lap engine 1788, sun-and-planet, double action and governor account", "Written TECH2.10 crank motion and CTRL1.2 centrifugal governor; own two-state feedback example"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co50948/rotative-steam-engine-by-boulton-and-watt-1788"},
      statement:String.raw`Sun-and-planet gearing turns the beam’s reciprocation into shaft rotation. For equal external gears, with carrier angle $\phi$, absolute planet orientation $\alpha$ and shaft angle $\theta$, rolling without slip constrains
$$\theta+\alpha=2\phi.$$
The planet is attached to a moving rod: it can oscillate rather than remaining absolutely fixed. If its orientation returns after a full carrier circuit, the shaft completes two turns. The Lap engine’s governor is a separate speed-control mechanism; the gear ratio alone does not regulate a changing load.`,
      idea:String.raw`TECH2.10 supplies the distinction between reciprocation and rotation. Here the declared rod orientation is $\alpha=\epsilon\sin\phi$, so the drawn sun angle is computed from the actual gear constraint. CTRL1.2 explains the sign of centrifugal feedback: faster rotation spreads the balls and can reduce steam admission. Our dimensionless response example uses speed deviation $x$ and throttle correction $u$:
$$\dot x=-x+u-\ell,\qquad \tau\dot u=-u-gx.$$
For a step load $\ell$, its equilibrium has $x=-\ell/(1+g)$: proportional control leaves droop. Governor-ball geometry is a separate chosen conical-equilibrium cue with $\cos\beta=0.2/\omega^2$ and $\omega=1+x$; it does not derive or calibrate the linear throttle law.`,
      caption:String.raw`Turn the carrier to see both gears respect their angle constraint. Change feedback gain, lag and load to see the speed response and remaining droop. The ball geometry follows the selected speed through its stated equilibrium relation; a missing conical branch is explicitly identified.`,
      scope:String.raw`Equal ideal gears, chosen periodic planet orientation and no tooth elasticity, backlash or solved connecting-rod dynamics. The stable two-state linear system is an authored feedback illustration, not a full historical engine, a centrifugal-governor calibration or a model proving hunting instability. Time and speed are dimensionless. The ball model has unit arm length and chosen normalized gravity 0.2; its instantaneous conical equilibrium is distinct from the lagged throttle state.`,
      viz(v){techSteamViz(v,6);}
    },
    {
      num:"7.7",
      kind:"Invention",
      name:"Watt’s parallel motion linkage",
      deps:["tech-7.6"],
      tags:["industrial", "1784"],
      credit:"Watt parallel-motion family, eighteenth century",
      refs:["Thurston 1886 selected Watt parallel-motion mechanism passage and original figure", "Own exact four-bar circle construction; midpoint mechanism only, not the full patented pantograph"],
      links:{"source": "https://www.gutenberg.org/files/35916/35916-h/35916-h.htm"},
      statement:String.raw`A rigid piston rod must be guided when a beam both pushes and pulls. A Watt-type four-bar linkage combines two circular motions so that a point on the joining rod follows an approximately straight path. It is not an exact straight-line mechanism.

In the chosen example, fixed pivots are $O_1=(-2,1)$ and $O_2=(2,-1)$, the two arms and coupler all have length 2, and
$$P=O_1+2(\cos\theta,\sin\theta).$$
Point $Q$ is the selected continuous intersection of the radius 2 circles about $P$ and $O_2$. The tracked point is $M=(P+Q)/2$.`,
      idea:String.raw`The assembly branch passes through $P=(0,1)$, $Q=(0,-1)$ and $M=(0,0)$ at $\theta=0$. Within the stated input range, the midpoint’s sideways error has the sign of $\theta$ and starts at order $\theta^5$, whereas the single beam end’s sideways error starts at order $\theta^2$. The two circular deviations largely cancel. The implementation rationalizes their difference before rounding, so a small nonzero deviation is not mistaken for exact straightness. This explains the guiding principle of the mechanism; Watt’s complete parallel motion can also use a pantograph to transfer the guided path.`,
      caption:String.raw`Move the input arm through its permitted range. Follow the actual rods and midpoint locus, then compare the magnified lateral error with the beam end’s arc. The error plot retains its own units and scale; it does not alter the physical rod geometry.`,
      scope:String.raw`A specific unit-length four-bar with input angle−0.55 to 0.55 radians and one fixed assembly branch. Lengths are generic model units, not dimensions measured from a surviving engine. The full patented pantograph, joint play and elastic loading are omitted. Only the centre input has exactly zero lateral deviation in this range. A positive error below binary 64 range is reported as unresolved, not as an exact straight segment.`,
      viz(v){techSteamViz(v,7);}
    },
    {
      num:"7.8",
      kind:"Method",
      name:"The indicator diagram",
      deps:["tech-7.5", "mech-3.1"],
      tags:["industrial", "c. 1796"],
      credit:"Steam-engine indicator method, late eighteenth century",
      refs:["Thurston 1886 selected indicator passage: pressure spring/piston and position-driven board", "Written MECH3.1 work; own prescribed pressure-volume cycle and independent work quadrature"],
      links:{"source": "https://www.gutenberg.org/files/35916/35916-h/35916-h.htm"},
      statement:String.raw`An indicator relates cylinder pressure to piston position; multiplying position change by piston area gives volume change. The signed enclosed area of a pressure-volume loop is indicated work per cycle,
$$W=\oint p\,dV.$$
Our prescribed outward branch admits steam at pressure $p_s$ until volume $V_c$, then follows $p=p_s(V_c/V)^n$ to $V_{\max}$. The return branch has chosen back pressure $p_b$. Instantaneous pressure jumps at fixed volume contribute no work.`,
      idea:String.raw`MECH3.1 gives $dW=F\,dx=pA\,dx=p\,dV$. Integrate each branch: admission contributes $p_s(V_c-V_{\min})$, expansion contributes $p_sV_c^n\int_{V_c}^{V_{\max}}V^{-n}dV$, and the return subtracts $p_b(V_{\max}-V_{\min})$. At $n=1$, the expansion term is $p_sV_c\log(V_{\max}/V_c)$; a stable limiting expression covers nearby exponents. Subtracting a constant ambient pressure from every branch changes the plotted pressure origin but not the closed-loop area. A negative net area remains negative in the readout.`,
      caption:String.raw`Change cut-off, expansion exponent and back pressure. Trace the actual loop with the indicator stylus, switch between absolute and gauge pressure, and compare admission, expansion and return work. The spring and moving board separate the two measured coordinates.`,
      scope:String.raw`A declared quasi-static loop, not a measured indicator card, a complete steam-property cycle or solved valve timing. Pressures are kPa and volumes m³, so loop work is kJ. Positive clearance prevents a singular zero-volume origin. Some inputs prescribe an outward pressure below the return back pressure; those segments have negative net contribution and are not silently replaced by a realizable valve cycle. The trace control selects path position, not elapsed time.`,
      viz(v){techSteamViz(v,8);}
    },
    {
      num:"7.9",
      kind:"Invention",
      name:"High-pressure steam (Trevithick, Evans)",
      deps:["tech-7.5", "tech-3.4"],
      tags:["industrial", "1800"],
      credit:"Trevithick and Vivian 1802 patent; Evans high-pressure practice",
      refs:["Science Museum Group, Trevithick high-pressure engine c. 1805–1806, collection record", "Thurston 1886, Evans discussion", "Own pressure-displacement identity and elastic thick/thin cylinder comparison"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co51033"},
      statement:String.raw`Higher working pressure can supply a chosen indicated power with less swept volume. Trevithick and Vivian’s 1802 patent and the museum’s c. 1805–1806 engine witness one path to compact high-pressure machinery; Evans developed high-pressure non-condensing engines in the United States. Compactness also raises demands on the pressure-containing structure.

For chosen pressure difference $\Delta p$, swept volume $V$ and working-cycle frequency $f$, our rectangular-cycle identity is $P=\Delta pVf$. Thus $V=P/(\Delta pf)$ at fixed indicated power.`,
      idea:String.raw`The pressure-work balance from 7.5 explains the volume reduction without a fabricated historical power series. A separate ideal elastic cylinder has inner radius $r$ and thickness $t$. The thin-wall hoop-stress estimate is $\sigma_\theta=\Delta pr/t$. Lamé’s static thick-cylinder solution with zero external gauge pressure gives inner-wall hoop stress $\Delta p[(r+t)^2+r^2]/[(r+t)^2-r^2]$. Comparing the expressions shows the geometric approximation explicitly; stress alone does not establish a material’s allowable operating pressure.`,
      caption:String.raw`Raise the chosen pressure and compare the displacement required at the same power. Adjust radius and wall thickness to inspect the cylinder cross-section and both elastic stress estimates. A thickness-to-radius diagnostic identifies where the thin-wall approximation is being stretched.`,
      scope:String.raw`Illustrative constant pressure difference and cycle frequency; no measured engine efficiency, steam flow, condensation loss or locomotive performance. Stress calculations assume an ideal uniform elastic cylinder and omit temperature-dependent strength, joints, corrosion, flaws, fatigue and thermal stress. The chosen thin-wall diagnostic is t/r≤0.05; it is not a safety rating or bursting limit. The model does not specify a real boiler’s operating limits.`,
      viz(v){techSteamViz(v,9);}
    },
    {
      num:"7.10",
      kind:"Concept",
      name:"Carnot’s analysis of heat engines",
      deps:["tech-7.8", "thermo-2.7"],
      tags:["industrial", "1824"],
      credit:"Carnot 1824; modern absolute-temperature formulation",
      refs:["Thurston 1886, Carnot discussion, p.437; later historical commentary", "Written THERMO2.7 reversible heat-engine bound and modern absolute-temperature convention"],
      links:{"source": "https://www.gutenberg.org/files/35916/35916-h/35916-h.htm"},
      statement:String.raw`Carnot’s 1824 analysis made the temperature difference between source and sink central to heat-engine theory. His original framework used caloric ideas. In the modern absolute-temperature formulation already developed in THERMO2.7, every heat engine working between reservoirs $T_h>T_c>0$ satisfies
$$\eta\le 1-\frac{T_c}{T_h}.$$
Equality requires a reversible cycle. A larger pressure or a better machine alone does not bypass this reservoir-temperature bound.`,
      idea:String.raw`For heat input $Q_h$, a chosen fraction $a$ of the Carnot limit gives $W=a(1-T_c/T_h)Q_h$ and rejected heat $Q_c=Q_h-W$. The reservoir entropy change is
$$\Delta S=\frac{Q_c}{T_c}-\frac{Q_h}{T_h}.$$
Equivalently,
$$\Delta S=\frac{Q_h(1-a)(T_h-T_c)}{T_hT_c}\ge 0.$$
The second expression preserves exact zero at the chosen reversible limit without subtracting two nearly equal rounded quantities. Equal temperatures give no heat-engine work. Reversing the stated hot/cold ordering invalidates this positive heat-engine arrangement rather than generating an invented negative-efficiency engine.`,
      caption:String.raw`Change both reservoir temperatures in kelvin, the chosen input heat and the fraction of the reversible limit. Follow the computed heat and work flows and compare the bound with the selected efficiency. The entropy ledger identifies reversible, irreversible and equal-temperature cases.`,
      scope:String.raw`Modern two-reservoir heat-engine bound; all temperatures are kelvin. The selected fraction of the limit is an authored parameter, not measured Newcomen, Watt or turbine efficiency. No historical efficiency timeline is manufactured. The bound follows the modern thermodynamics prerequisite; historical context follows Thurston’s later commentary. Reversed reservoir inputs have no heat-engine result in this model.`,
      viz(v){techSteamViz(v,10);}
    },
    {
      num:"7.11",
      kind:"Invention",
      name:"Puddling and rolling (Cort)",
      deps:["tech-7.3"],
      tags:["industrial", "1784"],
      credit:"Cort’s 1784 patent and later puddling practice",
      refs:["NorthLan Museums, Puddlers/Shinglers/Rollers, article", "Science Museum Group, puddled anchor-chain links, collection record", "Own declared two-species removal rates and incompressible constant-width rolling identity"],
      links:{"source": "https://www.northlanmuseums.co.uk/story/puddlers-shinglers-rollers-the-story-of-malleable-iron/"},
      statement:String.raw`Puddling refines pig iron in a reverberatory furnace, where hot gases heat the charge without placing it directly in the fuel. Working the charge and subsequent hammering and rolling produce usable wrought iron. NorthLan Museums describes Cort’s 1784 patent as building on earlier work and emphasizes the skilled labour involved. Later changes to furnace practice mattered too; the process was not a single instantly completed invention.

Rolling shapes hot metal. In our constant-width, constant-density example, thickness reduction from $h$ to $h'$ requires length increase from $L$ to $L'=Lh/h'$.`,
      idea:String.raw`TECH3.3 distinguishes high-carbon cast iron from low-carbon wrought material. To separate mass removal from concentration, choose toy rates $C(t)=C_0 e^{-k_Ct}$ and $F(t)=F_0 e^{-k_Ft}$ for carbon and iron masses. Carbon concentration is $C/(C+F)$ and falls only when carbon’s fractional removal rate exceeds iron’s. Faster iron loss can make concentration rise even while carbon mass falls. This is an accounting counterexample, not an empirical puddling law. The rolling construction separately conserves volume: $whL=wh'L'$. Neither calculation supplies a historical output-per-worker comparison.`,
      caption:String.raw`Inspect the separated fire and iron charge, then vary the chosen removal rates to compare carbon mass with carbon concentration. Adjust rolling reduction to see a thinner, longer strip with the same modeled volume. The selected process position is separate from any historical furnace timing.`,
      scope:String.raw`Authored two-species exponential rates in arbitrary time units and a generic constant-width rolling strip. Slag, other alloying elements, oxidation heat, phase changes, spread, elastic recovery and worker technique are omitted. The rate constants are not measured process kinetics. The schematic is explanatory and no productivity, labour-saving ratio or sole-inventor certificate is inferred from it.`,
      viz(v){techSteamViz(v,11);}
    },
    {
      num:"7.12",
      kind:"Invention",
      name:"The Bessemer converter",
      deps:["tech-7.11"],
      tags:["industrial", "1856"],
      credit:"Bessemer process; surviving Barrow pilot converter 1865",
      refs:["Science Museum Group, original pilot Bessemer converter 1865, collection record", "Own chosen metal/carbon/phosphorus and heat ledger; no real-time kinetics or historical prices"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co19568/original-pilot-bessemer-converter-1865"},
      statement:String.raw`Blowing air through molten pig iron oxidizes constituents including carbon. The released heat can sustain the process without adding fuel during the blow. The Science Museum’s 1865 Barrow pilot converter is a surviving witness. Its account also identifies phosphorus-rich iron as a difficulty, so removing carbon alone must not be presented as removing every unwanted constituent.

Our acid-converter teaching ledger starts with 1000 kg of metal and removes a selected fraction $f$ of its initial carbon mass $C_0$. Remaining carbon is $(1-f)C_0$ and remaining metal mass is $1000-fC_0$.`,
      idea:String.raw`Carbon concentration divides remaining carbon by remaining metal, not by a fixed 1000 kg denominator. The chosen model leaves phosphorus mass unchanged; its mass fraction can therefore rise as carbon leaves. Iron mass is also held fixed to isolate this mechanism. For an expressly chosen heat release $q$ per kg of carbon removed and selected heat loss $L$, the simple ledger gives $Q_{\rm net}=fC_0 q-L$. These inputs show how oxidation can support a heat budget but do not calculate actual bath temperature or establish that every blow remains molten.`,
      caption:String.raw`Select how much carbon is removed and compare the converter’s initial and remaining metal ledger. Follow the unchanged phosphorus mass and changing fraction. Vary the chosen oxidation-heat and loss parameters to see positive or negative net heat without inventing a process-time or steel-price curve.`,
      scope:String.raw`A deliberately simplified acid-process metal ledger; other oxidized elements, iron losses, oxygen mass in exhaust, slag, recarburizing and later basic-process chemistry are omitted. All heat-release and loss values are authored parameters in MJ, not tabulated reaction enthalpies or measured converter data. There is no real kinetic law, predicted temperature, product-grade certification or historical price series.`,
      viz(v){techSteamViz(v,12);}
    },
    {
      num:"7.13",
      kind:"Invention",
      name:"The screw-cutting lathe and standard threads",
      deps:["tech-7.4", "tech-2.4"],
      tags:["industrial", "c. 1800"],
      credit:"Maudslay screw-cutting lathe, c. 1800",
      refs:["Science Museum Group, original Maudslay lathe c. 1800, collection record", "Written TECH2.4 screw lead; own change-gear, helix and prescribed lead-screw error relations"],
      links:{"source": "https://collection.sciencemuseumgroup.org.uk/objects/co46284/henry-maudslays-original-screw-cutting-lathe-c-1800-lathes"},
      statement:String.raw`A screw-cutting lathe gears the lead screw to the work spindle so the cutting tool advances a reproducible distance per work revolution. The Science Museum’s c. 1800 Maudslay lathe records a geared lead screw, sliding rest and depth adjustment. Its missing change wheels are not a surviving complete gear set.

If the lead screw advances $l_s$ per turn and the gear ratio magnitude is $z_d/z_f$, tool advance per spindle revolution is $l=l_sz_d/z_f$. For an $n$-start thread, axial pitch is $l/n$, while lead remains $l$.`,
      idea:String.raw`TECH2.4 explains a screw’s advance. Geared synchronization transfers that relation to machining: rotating the work and feeding the tool together generates a helix. Gear parity and screw handedness determine direction; this model chooses positive forward feed and uses the ratio magnitude. Multiple starts require corresponding phase offsets rather than a faster carriage feed. A prescribed lead-screw error $e(x)=A\sin(2\pi x/\lambda)+sx$ is carried into tool position $x+e(x)$. Changing gears changes the nominal lead but does not remove that chosen error. A finite wheel set gives rational ratios, not every arbitrary real pitch.`,
      caption:String.raw`Change the driving and driven tooth counts, turn the spindle and compare tool feed with the unrolled thread helices. Select the number of starts to distinguish pitch from lead. The error plot follows the same ideal carriage position and declared lead-screw error.`,
      scope:String.raw`One ideal external change-gear pair and a rigid synchronized carriage; positive lead magnitudes in mm. Gear backlash, tool deflection, bearing errors and cutting forces are omitted. The sinusoidal and linear errors are chosen teaching inputs, not measurements from Maudslay’s lathe. Multi-start geometry is displayed with phase offsets; no particular historical thread standard or unlimited real-pitch capability is inferred.`,
      viz(v){techSteamViz(v,13);}
    },
    {
      num:"7.14",
      kind:"Invention",
      name:"Interchangeable parts",
      deps:["tech-7.13"],
      tags:["industrial"],
      credit:"Nineteenth-century systems of gauged manufacture",
      refs:["National Park Service, Armory and City, complete exhibit body: machinery, standardized gauges and interchangeable manufacture", "Own generic shaft/hole model, exact independent uniform-difference probabilities and seeded finite batches"],
      links:{"source": "https://www.nps.gov/spar/learn/historyculture/armory-and-city.htm"},
      statement:String.raw`Interchangeability makes separately produced parts fit within a declared assembly requirement without individual filing. It depends on a manufacturing system: dimensions, gauges, tools, process control and inspection. The National Park Service’s Springfield account describes standardized gauges and power-driven machinery in that system; it does not establish one person as its sole inventor.

Our generic shaft and hole have clearance $D=c+b+H-S$, where $c$ is nominal clearance, $b$ is a chosen bias, and independent errors $H$ and $S$ are uniform on their stated symmetric intervals. A pair fits when $d_{\min}\le D\le d_{\max}$.`,
      idea:String.raw`For nonzero error widths, the difference distribution is triangular or trapezoidal and its exact piecewise-polynomial area gives the expected fit probability. When one width is zero it becomes a uniform distribution; when both are zero it is a point mass, so inclusive boundary tests matter. Tightening widths helps only when the distribution is appropriately centred: with excessive bias, perfect precision can produce zero successful fits. The displayed finite batch uses a fixed pseudorandom seed and exact original-input comparisons. Its observed fraction is a sample result, not the theoretical probability or evidence about a historical factory.`,
      caption:String.raw`Change error widths, nominal clearance and bias, then inspect the allowed band in the shaft/hole error plane. Compare the exact expected fit probability with actual accepted pairs in the selected batch. Try zero widths and a biased centre to expose cases that a smooth bell curve would conceal.`,
      scope:String.raw`Generic abstract circular parts, not a weapon or historical assembly reconstruction. Error distributions are independent uniforms with hard bounds, not measured manufacturing data. All dimensions are illustrative mm; the fit window is explicitly shown. Point masses and exact binary 64 input values are retained before display rounding. The LCG batch is deterministic, at most 144 pairs, and does not quantify uncertainty about any real process.`,
      viz(v){techSteamViz(v,14);}
    },
  ]
};
