// MICRO12: explicitly chosen teaching economies, independent of the renderer.
import * as Q from './ch12.exact.shared.js';
export {Q};
const {add,sub,mul,div,neg,sign,approximate:N}=Q;
export function quantity(x){x=Q.exact(x);const value=N(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value)};}
const q=quantity,sq=x=>mul(x,x),sum=xs=>xs.reduce(add,Q.ZERO);
const min=(a,b)=>sign(sub(a,b))<=0?Q.exact(a):Q.exact(b);
const max=(a,b)=>sign(sub(a,b))>=0?Q.exact(a):Q.exact(b);
const clip=(x,a,b)=>min(max(x,a),b);
const positive=x=>max(0,x);
function bound(x,a,b,label){if(!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside the declared model range');return x;}
function choice(x,options){if(!options.includes(x))throw Error('unknown model choice');return x;}
export const lin=(count,a,b)=>Array.from({length:count},(_,i)=>a+(b-a)*i/(count-1));

function marketParameters({demand=12,demandSlope=.5,privateIntercept=2,privateSlope=.5,damage=2,damageSlope=.25,capacity=16}={}){
 bound(demand,8,16,'demand intercept');bound(demandSlope,.1,.5,'demand slope');bound(privateIntercept,0,5,'private cost intercept');bound(privateSlope,.1,1.5,'private cost slope');bound(damage,0,8,'external cost intercept');bound(damageSlope,0,.5,'external cost slope');bound(capacity,1,16,'capacity');
 return{demand,demandSlope,privateIntercept,privateSlope,damage,damageSlope,capacity};
}
function economy(p){
 const r=sub(p.demand,p.privateIntercept),s=add(p.demandSlope,p.privateSlope),sSocial=add(s,p.damageSlope),privateQuantity=clip(div(r,s),0,p.capacity),socialQuantity=clip(div(sub(r,p.damage),sSocial),0,p.capacity);
 const benefit=x=>sub(mul(p.demand,x),div(mul(p.demandSlope,sq(x)),2)),privateCost=x=>add(mul(p.privateIntercept,x),div(mul(p.privateSlope,sq(x)),2)),damage=x=>add(mul(p.damage,x),div(mul(p.damageSlope,sq(x)),2)),profit=x=>sub(benefit(x),privateCost(x)),welfare=x=>sub(profit(x),damage(x));
 return{r,s,sSocial,privateQuantity,socialQuantity,benefit,privateCost,damage,profit,welfare};
}
export function externality({quantity:chosen=10,tax=0,...input}={}){
 const p=marketParameters(input);bound(chosen,0,p.capacity,'selected quantity');bound(tax,0,16,'per-unit tax');const e=economy(p),x=Q.exact(chosen),taxQuantity=clip(div(sub(e.r,tax),e.s),0,p.capacity),optimalTax=add(p.damage,mul(p.damageSlope,e.socialQuantity)),wSocial=e.welfare(e.socialQuantity),mb=sub(p.demand,mul(p.demandSlope,x)),mpc=add(p.privateIntercept,mul(p.privateSlope,x)),md=add(p.damage,mul(p.damageSlope,x));
 return{parameters:{...p,quantity:chosen,tax},selectedQuantity:q(x),privateQuantity:q(e.privateQuantity),socialQuantity:q(e.socialQuantity),taxQuantity:q(taxQuantity),optimalTax:q(optimalTax),marginalBenefit:q(mb),marginalPrivateCost:q(mpc),marginalDamage:q(md),marginalSocialCost:q(add(mpc,md)),benefit:q(e.benefit(x)),privateCost:q(e.privateCost(x)),externalCost:q(e.damage(x)),welfare:q(e.welfare(x)),socialWelfare:q(wSocial),privateWelfare:q(e.welfare(e.privateQuantity)),taxWelfare:q(e.welfare(taxQuantity)),privateLoss:q(sub(wSocial,e.welfare(e.privateQuantity))),selectedLoss:q(sub(wSocial,e.welfare(x))),taxLoss:q(sub(wSocial,e.welfare(taxQuantity))),taxRevenue:q(mul(tax,taxQuantity)),position:sign(sub(x,e.socialQuantity))<0?'below efficient quantity':sign(sub(x,e.socialQuantity))>0?'above efficient quantity':'efficient quantity'};
}
export function positiveSpillover({spillover=2,subsidy=2,...input}={}){
 bound(spillover,0,8,'external marginal benefit');bound(subsidy,0,8,'per-unit subsidy');const p=marketParameters({...input,damage:0,damageSlope:0}),e=economy(p),social=clip(div(add(e.r,spillover),e.s),0,p.capacity),policy=clip(div(add(e.r,subsidy),e.s),0,p.capacity),welfare=x=>add(e.profit(x),mul(spillover,x));
 return{parameters:{...p,spillover,subsidy},privateQuantity:q(e.privateQuantity),socialQuantity:q(social),policyQuantity:q(policy),optimalSubsidy:q(spillover),privateWelfare:q(welfare(e.privateQuantity)),socialWelfare:q(welfare(social)),policyWelfare:q(welfare(policy)),externalBenefit:q(mul(spillover,policy)),subsidyPayment:q(mul(subsidy,policy)),policyLoss:q(sub(welfare(social),welfare(policy))),privateLoss:q(sub(welfare(social),welfare(e.privateQuantity)))};
}

// A weakly beneficial deal is optional at exact indifference. Its fixed real
// transaction cost is shared equally; the transfer is chosen within the full
// individually rational interval. Rejected deals incur neither cost nor payment.
function agreement({profit,damage,fallback,target,transactionCost,transferShare,tie,quiet}){
 const same=sign(sub(fallback,target))===0,baseline=sub(profit(fallback),damage(fallback)),gross=sub(sub(profit(target),damage(target)),baseline),net=sub(gross,transactionCost),half=div(transactionCost,2);
 const lower=quiet?add(damage(target),half):add(sub(profit(fallback),profit(target)),half),upper=quiet?sub(profit(target),half):sub(sub(damage(fallback),damage(target)),half),accepted=!same&&(sign(net)>0||sign(net)===0&&tie==='agreement'),payment=accepted?add(lower,mul(transferShare,sub(upper,lower))):Q.ZERO,x=accepted?target:fallback,cost=accepted?Q.exact(transactionCost):Q.ZERO,signedToProducer=quiet?neg(payment):payment,producerGain=sub(add(sub(profit(x),profit(fallback)),signedToProducer),div(cost,2)),harmedGain=sub(sub(sub(damage(fallback),damage(x)),signedToProducer),div(cost,2));
 const status=same?'fallback already efficient':sign(net)>0?'profitable agreement':sign(net)===0?'indifferent agreement':'no feasible agreement';
 return{fallback:q(fallback),target:q(target),quantity:q(x),grossGain:q(gross),netPotentialGain:q(net),paymentLower:q(lower),paymentUpper:q(upper),payment:q(payment),signedToProducer:q(signedToProducer),transactionCostPaid:q(cost),producerGain:q(producerGain),harmedGain:q(harmedGain),realizedGain:q(add(producerGain,harmedGain)),welfare:q(sub(sub(profit(x),damage(x)),cost)),accepted,status,paymentDirection:quiet?'producer pays affected party':'affected party pays producer'};
}
export function bargaining({rights='produce',transactionCost=0,transferShare=.5,tie='agreement',...input}={}){
 choice(rights,['produce','quiet']);choice(tie,['agreement','fallback']);bound(transactionCost,0,120,'transaction cost');bound(transferShare,0,1,'transfer within feasible interval');const p=marketParameters(input),e=economy(p),fallback=rights==='produce'?e.privateQuantity:Q.ZERO;
 return{parameters:{...p,rights,transactionCost,transferShare,tie},...agreement({profit:e.profit,damage:e.damage,fallback,target:e.socialQuantity,transactionCost,transferShare,tie,quiet:rights==='quiet'})};
}

export function abatement({emissionsA=8,emissionsB=8,slopeA=1,slopeB=3,reduction=.5,permitShare=.5}={}){
 bound(emissionsA,2,12,'baseline emissions A');bound(emissionsB,2,12,'baseline emissions B');bound(slopeA,.1,4,'abatement slope A');bound(slopeB,.1,4,'abatement slope B');bound(reduction,0,1,'required reduction fraction');bound(permitShare,0,1,'initial permit share');
 const total=add(emissionsA,emissionsB),required=mul(reduction,total),lower=max(0,sub(required,emissionsB)),upper=min(emissionsA,required),a=clip(div(mul(slopeB,required),add(slopeA,slopeB)),lower,upper),b=sub(required,a),macA=mul(slopeA,a),macB=mul(slopeB,b),full=sign(sub(required,total))===0,zero=sign(required)===0,price=zero?Q.ZERO:full?max(macA,macB):sign(a)>0&&sign(sub(a,emissionsA))<0?macA:macB;
 const cost=(k,x)=>div(mul(k,sq(x)),2),standardA=div(mul(required,emissionsA),total),standardB=sub(required,standardA),costA=cost(slopeA,a),costB=cost(slopeB,b),costTotal=add(costA,costB),standardCost=add(cost(slopeA,standardA),cost(slopeB,standardB)),cap=sub(total,required),permitsA=mul(permitShare,cap),permitsB=sub(cap,permitsA),remainingA=sub(emissionsA,a),remainingB=sub(emissionsB,b),purchaseA=sub(remainingA,permitsA),purchaseB=sub(remainingB,permitsB),paymentA=mul(price,purchaseA),paymentB=mul(price,purchaseB);
 return{parameters:{emissionsA,emissionsB,slopeA,slopeB,reduction,permitShare},required:q(required),abatementA:q(a),abatementB:q(b),minimumA:q(lower),maximumA:q(upper),macA:q(macA),macB:q(macB),price:q(price),priceSupport:{minimum:q(price),maximum:full?null:q(price),unboundedAbove:full},costA:q(costA),costB:q(costB),totalCost:q(costTotal),standardA:q(standardA),standardB:q(standardB),standardCost:q(standardCost),savings:q(sub(standardCost,costTotal)),cap:q(cap),emissionsA:q(remainingA),emissionsB:q(remainingB),permitsA:q(permitsA),permitsB:q(permitsB),purchaseA:q(purchaseA),purchaseB:q(purchaseB),paymentA:q(paymentA),paymentB:q(paymentB),financialCostA:q(add(costA,paymentA)),financialCostB:q(add(costB,paymentB)),emissionsResidual:q(sub(add(remainingA,remainingB),cap)),transferResidual:q(add(paymentA,paymentB)),status:zero?'no required abatement':full?'full abatement; supporting price not unique':sign(a)===0||sign(sub(a,emissionsA))===0||sign(b)===0||sign(sub(b,emissionsB))===0?'capacity-constrained allocation':'interior equal marginal costs'};
}

export function goodsClass({rival=true,excludable=true,users=4,passes=2,stock=6}={}){
 if(typeof rival!=='boolean'||typeof excludable!=='boolean')throw Error('rivalry and exclusion are boolean assumptions');bound(users,1,12,'number of users');bound(passes,0,12,'available entry passes');bound(stock,1,8,'resource units');if(!Number.isInteger(users)||!Number.isInteger(passes))throw Error('whole users and entry passes required');
 const admitted=excludable?Math.min(users,passes):users,delivered=rival?Math.min(admitted,stock):admitted?stock:0,perUser=admitted?(rival?div(delivered,admitted):Q.exact(stock)):Q.ZERO,physicalUsed=rival?Q.exact(delivered):admitted?Q.exact(stock):Q.ZERO;
 return{parameters:{rival,excludable,users,passes,stock},admitted,excluded:users-admitted,perUser:q(perUser),physicalUsed:q(physicalUsed),unused:q(sub(stock,physicalUsed)),sumExperiences:q(mul(admitted,perUser)),status:rival?(excludable?'private good':'common-pool resource'):(excludable?'club good':'pure public good')};
}

function publicEconomy({benefitA=8,benefitB=6,slopeA=1,slopeB=1,cost=4}={}){
 bound(benefitA,2,10,'benefit intercept A');bound(benefitB,2,10,'benefit intercept B');bound(slopeA,.5,2,'benefit slope A');bound(slopeB,.5,2,'benefit slope B');bound(cost,.5,12,'marginal provision cost');
 const satA=div(benefitA,slopeA),satB=div(benefitB,slopeB),both=div(sub(add(benefitA,benefitB),cost),add(slopeA,slopeB));let efficient=positive(both);
 if(sign(sub(efficient,min(satA,satB)))>0)efficient=sign(sub(satA,satB))<0?positive(div(sub(benefitB,cost),slopeB)):positive(div(sub(benefitA,cost),slopeA));
 const mbA=x=>positive(sub(benefitA,mul(slopeA,x))),mbB=x=>positive(sub(benefitB,mul(slopeB,x))),benefit=(a,b,sat,x)=>{const y=min(x,sat);return sub(mul(a,y),div(mul(b,sq(y)),2));},benefit1=x=>benefit(benefitA,slopeA,satA,x),benefit2=x=>benefit(benefitB,slopeB,satB,x),welfare=x=>sub(add(benefit1(x),benefit2(x)),mul(cost,x));
 return{p:{benefitA,benefitB,slopeA,slopeB,cost},satA,satB,efficient,mbA,mbB,benefit1,benefit2,welfare};
}
export function publicProvision({provision=5,...input}={}){
 bound(provision,0,20,'selected shared provision');const e=publicEconomy(input),x=Q.exact(provision),privateA=positive(div(sub(e.p.benefitA,e.p.cost),e.p.slopeA)),privateB=positive(div(sub(e.p.benefitB,e.p.cost),e.p.slopeB));
 return{parameters:{...e.p,provision},efficient:q(e.efficient),saturationA:q(e.satA),saturationB:q(e.satB),mbA:q(e.mbA(x)),mbB:q(e.mbB(x)),mbTotal:q(add(e.mbA(x),e.mbB(x))),benefitA:q(e.benefit1(x)),benefitB:q(e.benefit2(x)),provisionCost:q(mul(e.p.cost,x)),welfare:q(e.welfare(x)),optimalWelfare:q(e.welfare(e.efficient)),loss:q(sub(e.welfare(e.efficient),e.welfare(x))),privateQuantityA:q(privateA),privateQuantityB:q(privateB),privateQuantityTotal:q(add(privateA,privateB)),activeAtOptimum:[sign(e.mbA(e.efficient))>0,sign(e.mbB(e.efficient))>0],optimalMarginalResidual:q(sub(add(e.mbA(e.efficient),e.mbB(e.efficient)),e.p.cost)),status:sign(e.efficient)===0?'zero-provision corner':'positive efficient provision'};
}
export function voluntary({players=4,benefit=8,slope=1,cost=2,provisionFraction=.75}={}){
 bound(players,1,10,'players');if(!Number.isInteger(players))throw Error('whole players required');bound(benefit,2,10,'individual benefit intercept');bound(slope,.5,2,'individual benefit slope');bound(cost,1,8,'unit contribution cost');bound(provisionFraction,0,1,'provision / saturation');
 const saturation=div(benefit,slope),nash=positive(div(sub(benefit,cost),slope)),social=positive(div(sub(mul(players,benefit),cost),mul(players,slope))),selected=mul(provisionFraction,saturation),B=x=>sub(mul(benefit,x),div(mul(slope,sq(x)),2)),w=x=>sub(mul(players,B(x)),mul(cost,x));
 return{parameters:{players,benefit,slope,cost,provisionFraction},saturation:q(saturation),nash:q(nash),social:q(social),selected:q(selected),symmetricNashContribution:q(div(nash,players)),symmetricSocialContribution:q(div(social,players)),selectedContribution:q(div(selected,players)),individualMarginalBenefit:q(sub(benefit,mul(slope,selected))),socialMarginalBenefit:q(mul(players,sub(benefit,mul(slope,selected)))),selectedWelfare:q(w(selected)),nashWelfare:q(w(nash)),optimalWelfare:q(w(social)),nashLoss:q(sub(w(social),w(nash))),selectedLoss:q(sub(w(social),w(selected))),nashSet:sign(nash)===0?'all contributions zero':players===1?'one contribution equals Nash total':'all nonnegative contribution vectors with the displayed Nash total'};
}
export function grazing({productivity=10,congestion=1,cost=2,effortFraction=1}={}){
 bound(productivity,6,12,'productivity intercept');bound(congestion,.5,2,'congestion slope');bound(cost,1,5,'unit effort cost');bound(effortFraction,0,1,'effort / open-access effort');const r=sub(productivity,cost),owner=div(r,congestion),open=mul(2,owner),effort=mul(effortFraction,open),product=x=>sub(mul(productivity,x),div(mul(congestion,sq(x)),2)),rent=x=>sub(product(x),mul(cost,x));
 return{parameters:{productivity,congestion,cost,effortFraction},owner:q(owner),openAccess:q(open),effort:q(effort),product:q(product(effort)),averageProduct:sign(effort)===0?null:q(sub(productivity,div(mul(congestion,effort),2))),marginalProduct:q(sub(productivity,mul(congestion,effort))),effortCost:q(mul(cost,effort)),rent:q(rent(effort)),ownerRent:q(rent(owner)),openAccessRent:q(rent(open)),loss:q(sub(rent(owner),rent(effort))),position:sign(sub(effort,owner))<0?'below rent-maximizing effort':sign(sub(effort,owner))>0?'above rent-maximizing effort':'rent-maximizing effort'};
}

function networkParameters({strength=4,price=.75,adjustment=.8,initial=.35,time=8}={}){
 bound(strength,1,8,'network benefit strength');bound(price,0,3,'network price');bound(adjustment,.1,2,'assumed adjustment speed');bound(initial,0,1,'initial adoption share');bound(time,0,20,'time');return{strength,price,adjustment,initial,time};
}
const networkField=(p,x)=>mul(mul(p.adjustment,x),sub(mul(p.strength,mul(x,sub(1,x))),p.price));
function advanceNetworkLog(y,dt,p){
 const count=Math.ceil(dt/.001),h=dt/count,rate=l=>{const x=Math.exp(l);return p.adjustment*(p.strength*x*(1-x)-p.price);};let correction=0;
 for(let i=0;i<count;i++){const a=rate(y),b=rate(y+h*a/2),c=rate(y+h*b/2),d=rate(y+h*c),increment=h*(a+2*b+2*c+d)/6-correction,next=y+increment;correction=(next-y)-increment;y=next;}return y;
}
function trajectoryQuantity(y){const value=Math.exp(y);return{exact:null,value,sign:1,logMagnitude:y,belowRange:value===0,aboveRange:false,approximate:true};}
export function network({time=8,...input}={}){
 const p=networkParameters({...input,time}),margin=sub(p.strength,mul(4,p.price)),disc=div(margin,p.strength),initialFlow=networkField(p,p.initial),stationary=sign(initialFlow)===0;let lower=null,upper=null;
 if(sign(margin)>=0){const root=Q.squareRoot(disc),lo=div(mul(2,div(p.price,p.strength)),add(1,root)),hi=sub(1,lo);lower={...q(lo),approximate:sign(networkField(p,lo))!==0};upper={...q(hi),approximate:sign(networkField(p,hi))!==0};}
 const state=time===0||stationary?q(p.initial):trajectoryQuantity(advanceNetworkLog(Math.log(p.initial),time,p));
 return{parameters:p,thresholdPrice:q(div(p.strength,4)),margin:q(margin),discriminant:q(disc),lower,upper,initialFlow:q(initialFlow),state,stationary,status:p.price===0?'zero unstable from the right; full adoption stable':sign(margin)>0?'zero and upper equilibria stable; lower critical mass unstable':sign(margin)===0?'coalesced equilibrium attracts from above and repels from below':'only zero-adoption equilibrium',trajectoryMethod:'RK4 in log adoption; approximate trajectory, exact retained phase classification'};
}
export function networkHistory(input={},count=201){
 if(!Number.isInteger(count)||count<2||count>1001)throw Error('history sample count outside range');const p=networkParameters(input),stationary=sign(networkField(p,p.initial))===0,dt=20/(count-1);let y=p.initial?Math.log(p.initial):-Infinity;
 return lin(count,0,20).map((time,i)=>{if(i&&!stationary)y=advanceNetworkLog(y,dt,p);return{time,state:i===0||stationary?q(p.initial):trajectoryQuantity(y)};});
}

// Interior linear-quadratic comparison, with uncertainty support chosen so
// neither policy reaches a quantity constraint. Actual welfare and expected
// losses remain distinct from tax/permit transfers.
export function pricesQuantities({costSlope=1,benefitSlope=.5,uncertainty=.6,shock=.5}={}){
 bound(costSlope,.25,4,'abatement-cost slope');bound(benefitSlope,0,4,'abatement-benefit slope');bound(uncertainty,0,1,'uncertainty scale');bound(shock,-1,1,'selected shock / support');const a=20,baseline=5,capacity=10,b=Q.exact(costSlope),d=Q.exact(benefitSlope),h=add(a,mul(add(b,d),baseline)),price=add(a,mul(b,baseline)),support=mul(mul(Q.rational(4,5),uncertainty),mul(b,baseline)),u=mul(shock,support),variance=div(sq(support),3),quantity=Q.exact(baseline),priced=sub(baseline,div(u,b)),optimal=sub(baseline,div(u,add(b,d))),benefit=x=>sub(mul(h,x),div(mul(d,sq(x)),2)),cost=x=>add(mul(add(a,u),x),div(mul(b,sq(x)),2)),w=x=>sub(benefit(x),cost(x)),optW=w(optimal),lossQ=sub(optW,w(quantity)),lossP=sub(optW,w(priced)),expectedQ=div(variance,mul(2,add(b,d))),expectedP=div(mul(variance,sq(d)),mul(mul(2,sq(b)),add(b,d))),difference=sub(expectedP,expectedQ);
 return{parameters:{costSlope,benefitSlope,uncertainty,shock},constants:{costIntercept:a,baseline,capacity},benefitIntercept:q(h),fixedPrice:q(price),shockSupport:q(support),selectedShock:q(u),variance:q(variance),fixedQuantity:q(quantity),priceQuantity:q(priced),optimalQuantity:q(optimal),quantityLoss:q(lossQ),priceLoss:q(lossP),quantityWelfare:q(w(quantity)),priceWelfare:q(w(priced)),optimalWelfare:q(optW),expectedQuantityLoss:q(expectedQ),expectedPriceLoss:q(expectedP),expectedDifference:q(difference),slopeDifference:q(sub(d,b)),status:sign(difference)<0?'price has lower expected loss':sign(difference)>0?'quantity has lower expected loss':'equal expected loss'};
}

export function lindahl({benefitA=8,benefitB=6,cost=8,share=.625,report=1}={}){
 bound(benefitA,6,10,'true benefit intercept A');bound(benefitB,6,10,'benefit intercept B');bound(cost,6,12,'unit public-good cost');bound(share,0,1,'personal price share A');bound(report,.85,1,'reported / true intercept A');
 const truth=positive(div(sub(add(benefitA,benefitB),cost),2)),reportedA=mul(report,benefitA),reportedG=positive(div(sub(add(reportedA,benefitB),cost),2)),truthPriceA=sub(benefitA,truth),truthPriceB=sub(cost,truthPriceA),reportedPriceA=sign(reportedG)>0?sub(reportedA,reportedG):reportedA,reportedPriceB=sub(cost,reportedPriceA),priceA=mul(share,cost),priceB=sub(cost,priceA),demandA=positive(sub(benefitA,priceA)),demandB=positive(sub(benefitB,priceB)),B=(a,g)=>sub(mul(a,g),div(sq(g),2)),truePayoffA=sub(B(benefitA,truth),mul(truthPriceA,truth)),reportPayoffA=sub(B(benefitA,reportedG),mul(reportedPriceA,reportedG)),truePayoffB=sub(B(benefitB,truth),mul(truthPriceB,truth)),reportPayoffB=sub(B(benefitB,reportedG),mul(reportedPriceB,reportedG));
 return{parameters:{benefitA,benefitB,cost,share,report},efficient:q(truth),equilibriumPriceA:q(truthPriceA),equilibriumPriceB:q(truthPriceB),equilibriumShareA:q(div(truthPriceA,cost)),selectedPriceA:q(priceA),selectedPriceB:q(priceB),demandA:q(demandA),demandB:q(demandB),demandGap:q(sub(demandA,demandB)),reportedInterceptA:q(reportedA),reportedProvision:q(reportedG),reportedPriceA:q(reportedPriceA),reportedPriceB:q(reportedPriceB),truePayoffA:q(truePayoffA),reportPayoffA:q(reportPayoffA),truePayoffB:q(truePayoffB),reportPayoffB:q(reportPayoffB),reportGainA:q(sub(reportPayoffA,truePayoffA)),trueWelfareChange:q(sub(add(reportPayoffA,reportPayoffB),add(truePayoffA,truePayoffB))),reportedBudgetResidual:q(sub(add(mul(reportedPriceA,reportedG),mul(reportedPriceB,reportedG)),mul(cost,reportedG))),status:sign(sub(demandA,demandB))===0?'individual demands agree':'individual demands disagree'};
}

export function cattle({margin=5,decline=1,damage=1,rights='produce',transactionCost=0,transferShare=.5,tie='agreement'}={}){
 bound(margin,0,12,'first-animal private margin');bound(decline,0,3,'decline in private margin');bound(damage,0,6,'damage coefficient');bound(transactionCost,0,80,'transaction cost');bound(transferShare,0,1,'transfer within interval');choice(rights,['produce','quiet']);choice(tie,['agreement','fallback']);
 const profit=n=>sub(mul(margin,n),div(mul(decline,mul(n,sub(n,1))),2)),D=n=>div(mul(damage,mul(n,add(n,1))),2),rows=Array.from({length:5},(_,herd)=>({herd,profit:profit(herd),damage:D(herd),joint:sub(profit(herd),D(herd))})),privateMax=rows.reduce((a,b)=>max(a,b.profit),rows[0].profit),jointMax=rows.reduce((a,b)=>max(a,b.joint),rows[0].joint),privateMaximizers=rows.filter(r=>sign(sub(r.profit,privateMax))===0).map(r=>r.herd),jointMaximizers=rows.filter(r=>sign(sub(r.joint,jointMax))===0).map(r=>r.herd),fallback=rights==='produce'?privateMaximizers[0]:0,target=jointMaximizers[0];
 return{parameters:{margin,decline,damage,rights,transactionCost,transferShare,tie},privateMaximizers,jointMaximizers,tieSelection:'smallest maximizing herd; complete maximizing sets retained',rows:rows.map(r=>({herd:r.herd,profit:q(r.profit),damage:q(r.damage),joint:q(r.joint)})),...agreement({profit,damage:D,fallback:Q.exact(fallback),target:Q.exact(target),transactionCost,transferShare,tie,quiet:rights==='quiet'}),sourceScope:'authored finite cattle worksheet; original Coase body/table unavailable and not verified'};
}

export function samuelson({tasteA=1,tasteB=.8,resources=16,cost=2,weight=.5,report=1,mode='hold allocation'}={}){
 bound(tasteA,.2,3,'taste parameter A');bound(tasteB,.2,3,'taste parameter B');bound(resources,8,24,'private resource endowment');bound(cost,1,4,'unit public-good resource cost');bound(weight,.1,.9,'normative weight A');bound(report,.5,1,'reported / true taste A');choice(mode,['hold allocation','plan from reports']);
 const allocate=a=>{const weighted=add(mul(weight,a),mul(sub(1,weight),tasteB)),g=positive(div(sub(mul(weighted,resources),cost),mul(cost,add(1,weighted)))),privateTotal=sub(resources,mul(cost,g));return{g,xA:mul(weight,privateTotal),xB:mul(sub(1,weight),privateTotal)};},truth=allocate(tasteA),declaredA=mul(report,tasteA),z=mode==='plan from reports'?allocate(declaredA):truth,trueMrsA=div(mul(tasteA,z.xA),add(1,z.g)),trueMrsB=div(mul(tasteB,z.xB),add(1,z.g)),reportedMrsA=div(mul(declaredA,z.xA),add(1,z.g)),uA=Math.log(N(z.xA))+tasteA*Math.log1p(N(z.g)),uB=Math.log(N(z.xB))+tasteB*Math.log1p(N(z.g));
 return{parameters:{tasteA,tasteB,resources,cost,weight,report,mode},truthfulProvision:q(truth.g),provision:q(z.g),privateA:q(z.xA),privateB:q(z.xB),publicResourceCost:q(mul(cost,z.g)),trueMrsA:q(trueMrsA),trueMrsB:q(trueMrsB),trueMrsTotal:q(add(trueMrsA,trueMrsB)),reportedMrsA:q(reportedMrsA),reportedMrsTotal:q(add(reportedMrsA,trueMrsB)),trueMarginalResidual:q(sub(add(trueMrsA,trueMrsB),cost)),reportedMarginalResidual:q(sub(add(reportedMrsA,trueMrsB),cost)),resourceResidual:q(sub(sum([z.xA,z.xB,mul(cost,z.g)]),resources)),utilityA:uA,utilityB:uB,weightedUtility:weight*uA+(1-weight)*uB,status:sign(z.g)>0?'positive public provision':'zero-public-good corner',welfareScope:'normative weights select a Pareto-efficient point under truthful information; no objective fairness ranking'};
}
