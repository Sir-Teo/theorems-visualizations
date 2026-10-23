import {matchesDomain} from './filter.mjs';
const form=document.querySelector('#filters');
if(form){
  const query=document.querySelector('#query'),method=document.querySelector('#method'),route=document.querySelector('#route');
  const rows=[...document.querySelectorAll('.domain-card')].map(card=>({card,search:card.dataset.search,methods:card.dataset.methods.split(' '),collections:Number(card.dataset.collections),editions:Number(card.dataset.editions)}));
  function update(){let count=0;for(const row of rows){row.card.hidden=!matchesDomain(row,{query:query.value,method:method.value,route:route.value});if(!row.card.hidden)count++;}document.querySelector('#results').textContent=`${count} of ${rows.length} available orientations`;document.querySelector('#empty').hidden=count!==0;}
  form.hidden=false;form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',update);form.addEventListener('change',update);
  form.addEventListener('reset',()=>{query.value='';method.value='';route.value='';update();});update();
}
