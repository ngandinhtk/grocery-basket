function ingredientKey(value){return String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase()}
function unitKey(value){const key=ingredientKey(value);return ({kilogram:'kg',kilograms:'kg',gram:'g',grams:'g',litre:'l',liter:'l',liters:'l',litres:'l',milliliter:'ml',millilitre:'ml'})[key]||key}
function combineTemplate(list,meal,{mode='merge',currency}={}){
 const next=list.map(x=>({...x}));let added=0,merged=0,skipped=0,separate=0;
 const resetPrices=!meal.currency||meal.currency!==currency;
 for(const source of meal.items){
  const incoming={...source,price:resetPrices?0:source.price,done:false};
  const names=next.filter(x=>!x.done&&ingredientKey(x.name)===ingredientKey(incoming.name));
  const match=names.find(x=>x.category===incoming.category&&unitKey(x.unit)===unitKey(incoming.unit));
  if(mode==='skip'&&match){skipped++;continue}
  if(mode==='merge'&&match&&match.qty+incoming.qty<=999){
   const quantity=Math.round((match.qty+incoming.qty)*100)/100;
   match.price=(match.price*match.qty+incoming.price*incoming.qty)/quantity;
   match.qty=quantity;merged++;continue;
  }
  if(names.length)separate++;
  next.push({...incoming,id:crypto.randomUUID()});added++;
 }
 return {items:next,added,merged,skipped,separate,resetPrices};
}
