import{CTRY,CNAME,AGE22,SEXY,lxSex,LxSex,asfr,indAt}from'./ch04.shared.js';
const frozen=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(frozen);Object.freeze(x);}return x;};
export const lifeAges=frozen([...AGE22]),years=frozen([...SEXY]),countries=frozen(CTRY.map(country=>({country,name:CNAME[country]})));
export const schedules=frozen(CTRY.flatMap(country=>SEXY.map(year=>({country,name:CNAME[country],year,survivors:[...lxSex(country,'f',year)],personYears:[...LxSex(country,'f',year)],fertility:[...asfr(country,year)],boysPer100Girls:indAt(country,'srb',year),publishedNRR:indAt(country,'nrr',year),publishedTFR:indAt(country,'tfr',year)}))));
