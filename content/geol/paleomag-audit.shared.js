import{D,angDist,rotMat,rotPts,rotApply}from'./ch03.shared.js';
export const APW_MODEL=Object.freeze({north:[0,90],eurAxis:[100,40],eurRate:.17,openAxis:[28,88],total:38,openingTime:170,siteNA:[-100,40],siteEU:[10,50]});
export const gadInclination=latitude=>Math.atan2(2*Math.sin(latitude*D),Math.cos(latitude*D))/D;
export const gadLatitude=inclination=>Math.atan2(Math.sin(inclination*D),2*Math.cos(inclination*D))/D;
export const chosenOpening=age=>APW_MODEL.total*Math.min(age/APW_MODEL.openingTime,1);
export const chosenEUPole=age=>rotPts(APW_MODEL.north,APW_MODEL.eurAxis,-APW_MODEL.eurRate*age);
export const chosenNAPole=age=>rotPts(chosenEUPole(age),APW_MODEL.openAxis,-chosenOpening(age));
export function apwState(age,restoration){const pEU=chosenEUPole(age),pNA=chosenNAPole(age),angle=restoration*chosenOpening(age),M=rotMat(APW_MODEL.openAxis,angle),shownNA=rotApply(M,pNA),siteNA=rotApply(M,APW_MODEL.siteNA),latNA=90-angDist(APW_MODEL.siteNA,pNA),latEU=90-angDist(APW_MODEL.siteEU,pEU);return{age,restoration,angle,open:chosenOpening(age),M,pEU,pNA,shownNA,siteNA,latNA,latEU,iNA:gadInclination(latNA),iEU:gadInclination(latEU),gap:angDist(shownNA,pEU)};}
