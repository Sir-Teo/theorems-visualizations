export const ILLUSTRATIVE_DRACHM_ML=3.7;
export function harveyArithmetic(perBeat,beats,bodyPounds,capacityOunces){
 const totalDrachms=perBeat*beats,totalPounds=totalDrachms/96;
 return {totalDrachms,totalPounds,wholePounds:Math.floor(totalPounds),remainingOunces:(totalPounds%1)*12,crossingMinutes:bodyPounds*96*30/totalDrachms,fraction:perBeat/(capacityOunces*8),perBeatMl:perBeat*ILLUSTRATIVE_DRACHM_ML,totalMl:totalDrachms*ILLUSTRATIVE_DRACHM_ML,bodyMl:bodyPounds*96*ILLUSTRATIVE_DRACHM_ML};
}
export const VEIN={lower:2,upper:7.6,valve:4.8};
export function veinState(step,position){
 const{lower:a,upper:b,valve}=VEIN,f=a+position*(b-a),reverseFinger=Math.max(valve+.35,b-position*(b-a));
 const filled=x=>step===1?true:step===2?!(x>a&&x<f):step===3?!(x>a&&x<valve):!(x>f&&x<b);
 return {f,reverseFinger,filled,closed:step===3};
}
