// Independently derived teaching models; sources actually read are recorded in the author report.
import {windWidget,diskWidget,tipWidget,statisticsWidget,heightWidget,wakeWidget} from './ch05.ui.shared.js';

const windSource='https://ocw.mit.edu/courses/22-081j-introduction-to-sustainable-energy-fall-2010/1b8f7cf6954227383a323ce08ffe6ae6_MIT22_081JF10_lec05b.pdf';
const diskSource='https://ocw.mit.edu/courses/res-2-008-thermodynamics-and-climate-change-summer-2020/mitres-2-008su22_book.pdf';

export default {
 collection:'energy',chapter:5,title:'Wind, water, heat and biomass',
 summary:String.raw`Air and water transport kinetic and potential energy; heat reservoirs and harvested biomass supply other energy budgets. Each conversion needs its own boundary and assumptions. The single-disk wind bound, regular and spectral wave conventions, finite-reservoir cooling and annual harvest accounting are derived explicitly, with chosen teaching parameters rather than site or crop forecasts.`,
 items:[
 {
 num:'5.1',kind:'Law',name:'Power in the wind: ½ρAv³',
 statement:String.raw`Uniform air of density $\rho$ and undisturbed speed $U\ge0$ crosses a fixed area $A$ perpendicular to its velocity. Its mass rate and kinetic-energy flux are
$$\begin{aligned}\dot m&=\rho AU,\\P_0&=\tfrac12\dot m U^2=\tfrac12\rho AU^3.\end{aligned}$$
For a circular reference disk, $A=\pi R^2$. Doubling $U$ multiplies this **reference flux** by eight at fixed density and area. It does not say that an operating turbine can remove all that energy.`,
 idea:String.raw`In a time interval $dt$, a slab of thickness $Udt$ crosses the area. Its mass is $\rho AUdt$ by continuity (fluid-1.5), and each unit mass carries kinetic energy $U^2/2$. Dividing by $dt$ gives the flux. The same dynamic-pressure normalization as aero-1.3 appears: power is dynamic pressure times area times speed. A working rotor changes the stream speed and must be analysed separately.`,
 caption:String.raw`Change undisturbed speed, radius or density. The curve and gold point show computed reference power; the second panel shows the actual distance swept in one second, with normalized cross-section. The readout checks area and mass rate. At exact zero speed both mass transport and kinetic flux vanish.`,
 deps:['fluid-1.5','aero-1.3'],see:['energy-5.2'],tags:['wind','kinetic energy','power'],
 refs:['MIT 22.081J, Kalmikov and Dykes wind lecture (2010), actual PDF slides 16–18','Independent mass-transport derivation'],links:{lecture:windSource},
 scope:String.raw`Uniform steady flow through a specified perpendicular reference area, chosen constant density and nonnegative speed. No turbulence average, measured wind distribution, turbine conversion efficiency or fully extractable power is implied.`,viz:windWidget,
 },
 {
 num:'5.2',kind:'Theorem',name:'Betz limit: at most 16/27',
 statement:String.raw`Consider a steady, incompressible, inviscid, unconfined stream passing through one ideal actuator disk, with equal ambient pressure far upstream and downstream, no swirl and no other energy input. Let $U>0$ be upstream speed, $A$ the disk area and $0\le a<1/2$ axial induction. Then
$$\begin{aligned}U_d&=U(1-a),\\U_w&=U(1-2a),\\C_P&=\frac{P}{\rho AU^3/2}=4a(1-a)^2,\\C_P&\le\frac{16}{27}.\end{aligned}$$
Equality occurs at $a=1/3$, when $U_w=U/3$. The reference area is the disk area in the undisturbed flux; this is a bound for this single-disk model.`,
 idea:String.raw`Continuity gives $\dot m=\rho AU_d$. The control-volume momentum balance (fluid-2.12) gives thrust $F=\dot m(U-U_w)$. Apply Bernoulli (fluid-2.9) separately on either side of the work-extracting disk; the pressure jump gives $F/A=\rho(U^2-U_w^2)/2$. Equating the two expressions yields $U_d=(U+U_w)/2$. Work at the disk is $P=FU_d$, hence the coefficient above. Its derivative is $4(1-a)(1-3a)$: the unique interior maximum is $a=1/3$. Bernoulli is not applied unchanged across the disk.`,
 caption:String.raw`Move induction and compare the actual upstream, disk and far-wake speeds. The coefficient reaches the horizontal $16/27$ line at one third induction. The readout computes the three continuity areas. The exact $a=1/2$ endpoint is excluded because its finite-speed streamtube geometry becomes singular.`,
 deps:['energy-5.1','fluid-1.5','fluid-2.12','fluid-2.9'],see:['energy-5.12'],tags:['wind','momentum','actuator disk'],
 refs:['Peter Godart, Thermodynamics and Climate Change, actual PDF 194–201 / printed 191–198, modern control-volume derivation','Independent thrust, pressure-jump and work calculation'],links:{modernDerivation:diskSource},
 scope:String.raw`One ideal disk, no swirl, blockage, confinement, losses or added energy; $U>0$ and $0\le a<1/2$. This does not give a universal bound for ducted, multistage or blocked-channel devices. The widget uses $a\le0.49$ and chosen air properties. The original 1920 body is unread; the historical entry retains its separate uncertainty flag.`,viz:diskWidget,
 },
 {
 num:'5.3',kind:'Definition',name:'Tip-speed ratio and the power coefficient curve',
 statement:String.raw`For radius $R$, angular speed $\omega$ and positive undisturbed wind $U$, define tip-speed ratio $\lambda=\omega R/U$ and power coefficient $C_P=P/(\rho AU^3/2)$. A response $C_P(\lambda)$ needs an aerodynamic model or measurement. Here a declared teaching response is
$$\begin{aligned}x&=\lambda/\lambda_*,\\C_P(\lambda)&=C_*x e^{1-x},\qquad x\ge0,\end{aligned}$$
with chosen $C_*=0.45$ and $\lambda_*>0$. Its maximum is $C_*$ at $\lambda=\lambda_*$. This curve is authored rather than a measured stall or blade-element calculation.`,
 idea:String.raw`The dimensionless ratio compares blade-tip speed with incoming air speed. For the chosen response, differentiating $xe^{1-x}$ gives $(1-x)e^{1-x}$, so the declared optimum is genuine and the maximum remains below the ideal single-disk bound. At fixed $U,R$, the required rotation is $\omega=\lambda U/R$; the blade drawing uses that actual angle $\omega t$. At $U=0$, the physical ratio is undefined even though a formal parameter can still index the response.`,
 caption:String.raw`Change the formal tip-speed parameter, chosen optimum, wind speed or elapsed rotation time. The gold point selects the authored response and the blades rotate through the computed angle. Try exact zero wind: the rotor stops and the readout distinguishes an undefined physical ratio from the formal curve parameter.`,
 deps:['energy-5.1','energy-5.2'],tags:['wind','dimensionless ratio','rotor'],
 refs:['MIT wind lecture (2010), actual PDF 16–18 for the reference power coefficient','Independent definition and explicitly authored exponential response'],links:{normalization:windSource},
 scope:String.raw`Chosen response for a fixed-radius teaching rotor, not an aerodynamic calibration. No shaft torque is inferred at zero angular speed. A tiny positive coefficient may round to zero while power remains representable after combining all physical factors; these are evaluated separately and disclosed.`,viz:tipWidget,
 },
 {
 num:'5.4',kind:'Model',name:'Wind-speed statistics and capacity factor',
 statement:String.raw`For a chosen Weibull wind distribution with scale $c>0$ and shape $k>1$,
$$\begin{aligned}F(u)&=1-e^{-(u/c)^k},\quad u\ge0,\\f(u)&=\frac{k}{c}(u/c)^{k-1}e^{-(u/c)^k}.\end{aligned}$$
If $P(u)=P_r p(u)$ for rated power $P_r$, the capacity factor is $\mathrm{CF}=\int_0^\infty p(u)f(u)\,du$ and mean power is $P_r\mathrm{CF}$. The chosen curve is zero up to 3 m/s, rises as $(u^3-3^3)/(12^3-3^3)$ to rated output at 12 m/s, stays rated below 25 m/s, then shuts off.`,
 idea:String.raw`Weight output at each wind speed by its probability, rather than insert mean speed into a nonlinear power curve. For this chosen curve the complete integral splits into a ramp from 3 to 12 and the exact plateau probability $F(25)-F(12)$; every speed beyond cut-out contributes zero output. The ramp uses composite Simpson quadrature with 400 panels and a 200-panel comparison. Convexity gives the pure-cube Jensen comparison only for an uncapped cubic response; the cut-out and rating here remove that universal inequality.`,
 caption:String.raw`Change Weibull scale, shape or nameplate power. Compare probability density with density times normalized output, and inspect the chosen cut-in/rated/cut-out curve. The readout separates ramp and plateau contributions, retains the probability beyond cut-out, and converts mean power to energy over a declared 365.25-day model year.`,
 deps:['energy-5.1','energy-1.4','energy-1.1'],tags:['wind','capacity factor','probability'],
 refs:['Official SAM Wind Resource help, actual annual Weibull distribution discussion','Independent density normalization, piecewise power integral and quadrature refinement'],links:{annualDistribution:'https://samrepo.nlr.gov/help/wind_resource.html'},
 scope:String.raw`A chosen annual marginal distribution and chosen turbine curve, not measured weather or a chronological wind year. It supplies no wind direction, availability losses, multiwake calculation or grid integration forecast. Shape is restricted to 1.2–3 so the density is finite and zero at the origin. Quadrature differences are diagnostics rather than certified error bounds.`,viz:statisticsWidget,
 },
 {
 num:'5.5',kind:'Model',name:'Wind shear: speed increases with height',
 statement:String.raw`A declared empirical power-law profile is
$$U(z)=U_{50}(z/50\,\mathrm m)^p,$$
with positive height $z$, chosen $U_{50}\ge0$ and exponent $p\ge0$. If $U_{50}>0$, fixed density, area and coefficient with no rating cap give
$$P(z)/P(50\,\mathrm m)=(z/50\,\mathrm m)^{3p}.$$
For $p>0$ and $U_{50}>0$, speed increases with height; $p=0$ gives a flat profile. One seventh is not a universal exponent.`,
 idea:String.raw`The profile is an empirical choice, not a consequence of the cube law. Taking the ratio cancels reference speed; cubing it then uses energy-5.1 under its unchanged-coefficient assumptions. Atmospheric stability, surface roughness and displacement can invalidate a single exponent. At zero reference speed the entire chosen profile is zero, and a ratio of two zero powers is undefined.`,
 caption:String.raw`Move the selected hub height, reference speed and chosen exponent. The gold point lies on the actual profile and the readout evaluates the uncapped power multiplier when its reference is nonzero. Try zero exponent and zero reference speed to distinguish a flat moving-air profile from no wind.`,
 deps:['energy-5.1'],tags:['wind','height profile','empirical model'],
 refs:['Independent consequences of the explicitly chosen power-law profile; no atmospheric dataset or boundary-layer derivation'],
 scope:String.raw`Chosen profile on 5–200 m, constant reference conditions, exponent 0–0.5. No universal atmosphere law, turbulence solution, blade-shear load model or predicted increase of rated turbine output.`,viz:heightWidget,
 },
 {
 num:'5.6',kind:'Phenomenon',name:'Wake losses in wind farms',
 statement:String.raw`A downstream device can encounter slower air behind an upstream rotor. This illustration prescribes two coaxial devices of radius $R$, induction $a$ and spacing $dR$, with chosen expansion parameter $k>0$:
$$\begin{aligned}R_w/R&=1+kd,\\r=U_2/U&=1-\frac{2a}{(1+kd)^2},\\P_1&=C_P\rho AU^3/2,\\P_2&=P_1r^3.\end{aligned}$$
The control measures spacing $s$ in rotor **diameters**, so $d=2s$. This is a prescribed top-hat recovery model, not a solved farm flow.`,
 idea:String.raw`Assign an expanding wake cross-section and dilute its initial velocity deficit by the chosen area ratio. Applying the same declared local single-device coefficient to the downstream speed gives the cubic factor. Writing $D=1-r$, the loss is $P_1D(3-3D+D^2)$, which avoids subtracting nearly equal powers. Larger spacing reduces the prescribed deficit, but real farm output also depends on wind direction, turbulence, overlapping wakes, control and atmospheric replenishment.`,
 caption:String.raw`Adjust spacing in diameters, wake expansion or induction. The selected downstream speed follows the prescribed recovery curve; two bars show the resulting upstream and downstream device powers. The readout separates deficit loss and total output. No grid layout, measured farm resource or calibrated power density is displayed.`,
 deps:['energy-5.1','energy-5.2'],tags:['wind','wakes','energy losses'],
 refs:['Independent prescribed two-device top-hat model; original Jensen 1983 institutional abstract only, original PDF inaccessible'],
 scope:String.raw`Two coaxial devices fully inside the prescribed top-hat wake, fixed local coefficient and no rating/cut-out curve. Recovery is an authored mixing assumption, not a globally momentum-conserving solution of the atmospheric boundary layer. Original Jensen 1983 body was not read; no figures, calibration or universal farm-density claims are reproduced.`,viz:wakeWidget,
 },
 ],
};
