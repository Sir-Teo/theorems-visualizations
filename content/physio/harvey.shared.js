/** Harvey's arithmetic in apothecary weights: 8 drachms/ounce and 12 ounces/pound. */
export function harveyOutput(drachmsPerBeat, beatsPerHalfHour, minutes=30) {
 const drachms=drachmsPerBeat*beatsPerHalfHour*minutes/30;
 return { drachms, ounces:drachms/8, pounds:drachms/96 };
}
/** Schematic of the Chapter XIII valve experiment, with hand at smaller x and heart at larger x. */
export function harveyVeinFilled(step,x,progress,{lower=2,valve=4.8}={}) {
 if(step===1)return true;
 const front=lower+progress*(valve-lower);
 if(step===2)return !(x>lower&&x<front);
 if(step===3)return !(x>lower&&x<valve);
 return !(x>front&&x<valve);
}
