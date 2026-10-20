/** Authored Gaussian teaching examples; no historical returns are simulated.
 * SPIVA constants alone are transcribed observations: official2024 Report1a,
 * All Large-Cap Funds vs S&P500, absolute returns, net fees excluding loads.
 */
import { erfc } from '../../assets/js/viz/math.js';

export const SPIVA_2024_LARGE_CAP = Object.freeze([[1,65.24],[3,84.96],[5,76.26],[10,84.34],[15,89.50]].map(Object.freeze));
export const EVENT_GROUPS = Object.freeze([-1,-.4,0,.4,1]);
const finite = x => Number.isFinite(x);

export function eventMean(day, effect, mode) {
  if (!finite(day) || !finite(effect) || !['jump','drift','early'].includes(mode)) throw new RangeError('Finite event time/effect and a valid response required');
  if (mode === 'jump') return day < 0 ? 0 : effect;
  if (mode === 'drift') return day < 0 ? 0 : effect * (.6 + .4 * Math.min(day,20) / 20);
  return day < -10 ? 0 : day < 0 ? effect * .35 * Math.min(1,(day+11)/10) : effect;
}

/** The mean of300 independent N(0,1.5²) daily errors has this exact normal law.
 * Draw one equivalent group-mean error per day, not300 fictional source firms.
 */
export function eventStudy(mode, effect, normal, count=300, dailySd=1.5) {
  if (!(finite(effect) && effect>=0 && Number.isInteger(count) && count>0 && finite(dailySd) && dailySd>=0 && typeof normal==='function')) throw new RangeError('Valid event model parameters required');
  eventMean(0,effect,mode);
  const meanSd=dailySd/Math.sqrt(count),groups=EVENT_GROUPS.map(group=>{
    const target=group*effect,expected=[],points=[],increments=[];let noise=0,previous=eventMean(-20,target,mode);
    for(let day=-20;day<=20;day++){
      const value=eventMean(day,target,mode);
      if(day>-20){const error=meanSd*normal();if(!finite(error))throw new RangeError('Finite standard-normal draw required');noise+=error;increments.push({day,mean:value-previous,error});}
      expected.push([day,value]);points.push([day,value+noise]);previous=value;
    }
    return{group,target,expected,points,increments};
  });
  return{mode,effect,count,dailySd,meanSd,terminalSd:Math.sqrt(40)*meanSd,groups};
}

export function eventIntraday(tau,delay) {
  if (!(finite(tau)&&tau>0&&finite(delay)&&delay>=0)) throw new RangeError('Positive adjustment time and nonnegative delay required');
  const t90=Math.log(10)*tau,end=Math.max(40,t90,delay),level=t=>t<0?0:-Math.expm1(-t/tau),times=[-5,0,t90,delay,...Array.from({length:241},(_,i)=>end*i/240)].sort((a,b)=>a-b);
  const points=times.filter((t,i)=>!i||t!==times[i-1]).map(t=>[t,level(t)]),entry=level(delay),remaining=Math.exp(-delay/tau);
  return{tau,delay,t90,end,points,entry,remaining,visible:level(end)-entry};
}

export function fundLaw({gross,fee,skill,te,H}) {
  if (![gross,fee,skill,te,H].every(finite)||fee<0||skill<0||te<=0||H<=0) throw new RangeError('Finite parameters, nonnegative fees/dispersion and positive tracking error/horizon required');
  const mean=gross-fee,variance=skill*skill+te*te/H,sd=Math.sqrt(variance),negative=.5*erfc(mean/(sd*Math.SQRT2)),correlation=skill*skill/variance;
  return{mean,variance,sd,negative,correlation};
}

export function fundScatter(parameters,normal,count=500) {
  const law=fundLaw(parameters);
  if(!Number.isInteger(count)||count<4||typeof normal!=='function')throw new RangeError('A finite population and standard-normal draws required');
  const {skill,te,H}=parameters,noiseSd=te/Math.sqrt(H),latent=[],points=[];
  for(let i=0;i<count;i++){const z=[normal(),normal(),normal()];if(!z.every(finite))throw new RangeError('Finite standard-normal draws required');const a=law.mean+skill*z[0];latent.push(a);points.push([a+noiseSd*z[1],a+noiseSd*z[2]]);}
  const mx=points.reduce((s,p)=>s+p[0],0)/count,my=points.reduce((s,p)=>s+p[1],0)/count;
  let xx=0,yy=0,xy=0;points.forEach(([x,y])=>{xx+=(x-mx)**2;yy+=(y-my)**2;xy+=(x-mx)*(y-my);});
  const sampleCorrelation=xx>0&&yy>0?xy/Math.sqrt(xx*yy):null,slope=xx>0?xy/xx:null,sortedY=points.map(p=>p[1]).sort((a,b)=>a-b),mid=Math.floor(count/2),median=count%2?sortedY[mid]:(sortedY[mid-1]+sortedY[mid])/2;
  const top=points.map((_,i)=>i).sort((a,b)=>points[b][0]-points[a][0]||a-b).slice(0,Math.ceil(count/4)),above=top.filter(i=>points[i][1]>median).length;
  return{...law,points,latent,count,noiseSd,mx,my,sampleCorrelation,slope,median,top,above,repeat:above/top.length};
}
