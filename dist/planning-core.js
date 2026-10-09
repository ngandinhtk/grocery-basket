// Pure planning helpers shared by the browser UI and its checks.
const planningCurrencies=['USD','VND','EUR','GBP'];
const referenceAmounts={
 'Gạo':[200,'g'],'Thịt heo':[300,'g'],'Trứng gà':[2,'eggs'],'Rau muống':[300,'g'],'Tỏi':[10,'g'],'Nước mắm':[30,'ml'],
 'Sữa tươi':[400,'ml'],'Thịt gà':[350,'g'],'Cà rốt':[150,'g'],'Cải xanh':[300,'g'],'Chuối':[2,'bananas'],'Đậu phụ':[300,'g'],
 'Nấm':[200,'g'],'Cải thìa':[300,'g'],'Nước tương':[30,'ml'],'Bánh mì':[2,'rolls'],'Dưa leo':[150,'g'],'Bánh phở':[300,'g'],
 'Thịt bò':[250,'g'],'Xương bò':[500,'g'],'Hành tây':[150,'g'],'Gừng':[20,'g'],'Hành lá':[20,'g'],'Rau thơm':[30,'g'],
 'Gia vị phở':[10,'g'],'Bún':[300,'g'],'Giò heo':[300,'g'],'Sả':[30,'g'],'Mắm ruốc':[10,'g'],'Ớt':[5,'g'],
 'Đu đủ xanh':[150,'g'],'Gạo tấm':[200,'g'],'Sườn heo':[350,'g'],'Cà chua':[200,'g'],'Thịt ba chỉ':[300,'g'],
 'Nước dừa':[300,'ml'],'Hành tím':[30,'g'],'Đường':[15,'g'],'Cá':[400,'g'],'Dứa':[150,'g'],'Đậu bắp':[100,'g'],
 'Giá đỗ':[150,'g'],'Me':[20,'g'],'Rau ngổ':[10,'g'],'Bánh tráng':[100,'g'],'Tôm':[250,'g'],'Xà lách':[150,'g'],
 'Tương đen':[40,'ml'],'Bột bánh xèo':[150,'g'],'Nước cốt dừa':[200,'ml'],'Bắp cải':[300,'g'],'Rau răm':[15,'g'],
 'Chanh':[1,'limes'],'Đậu phộng':[30,'g'],'Tiêu':[2,'g'],'Bí đỏ':[300,'g'],'Thịt heo xay':[150,'g'],
 'Cải thảo':[300,'g'],'Bắp non':[150,'g'],'Khoai tây':[300,'g'],'Bột cà ri':[10,'g'],'Bột bánh xèo chay':[150,'g']
};
function canonicalIngredient(name){
 const key=ingredientKey(name);
 for(const [vi,en] of Object.entries(ingredientEnglish))if(key===ingredientKey(vi)||key===ingredientKey(en))return ingredientKey(vi);
 return key;
}
function planningItemName(item){return item.templateIngredient&&[item.templateIngredient,ingredientEnglish[item.templateIngredient]].includes(item.name)?templateIngredientName(item.templateIngredient):item.name}
function planningUnit(unit){return tr(unit,({eggs:'quả',bananas:'quả',rolls:'ổ',limes:'quả'})[unit]||unit)}
function recipeMeal(index){
 const recipe=templates[index];if(!recipe)throw Error('INVALID_TEMPLATE');
 return {name:tr(recipe[2],recipe[1]),servings:2,currency:state.currency,reference:true,items:recipe[4].map(value=>{
  const [name,category]=value.split('|'),amount=referenceAmounts[name];if(!amount)throw Error('MISSING_AMOUNT');
  return {name:templateIngredientName(name),templateIngredient:name,category:categories[Number(category)],qty:amount[0],unit:amount[1],price:0,priceCurrency:state.currency};
 })};
}
function scaleMeal(meal,servings){
 const base=meal.servings||1;
 if(!Number.isInteger(servings)||servings<1||servings>20||!Number.isInteger(base)||base<1||base>20)throw Error('INVALID_SERVINGS');
 return {...meal,servings,items:meal.items.map(item=>{
  let qty=Math.round(item.qty*servings/base*100)/100,unit=item.unit||'',price=item.price;
  if(qty>999&&['g','ml'].includes(unit)){qty=Math.round(qty/1000*100)/100;unit=unit==='g'?'kg':'l';price*=1000}
  if(qty<0.01||qty>999)throw Error('QUANTITY_LIMIT');
  return {...item,name:planningItemName(item),qty,unit,price};
 })};
}
function mergePlanningItems(list,meal,{mode='merge',currency=state.currency}={}){
 if(!['merge','skip','separate'].includes(mode))throw Error('INVALID_MODE');
 const next=list.map(item=>({...item}));let added=0,merged=0,skipped=0,resetPrices=false;
 for(const original of meal.items){
  const incoming={...original,name:planningItemName(original),done:false};
  if((incoming.priceCurrency||meal.currency)!==currency){incoming.price=0;resetPrices=true}
  incoming.priceCurrency=currency;
  // Convert compatible mass/volume units before combining; prices follow their units.
  const match=mode==='separate'?null:next.find(item=>!item.done&&canonicalIngredient(item.name)===canonicalIngredient(incoming.name)&&item.category===incoming.category&&(item.priceCurrency||currency)===currency&&compatibleUnits(item.unit,incoming.unit));
  if(match&&mode==='skip'){skipped++;continue}
  if(match){
   const factor=unitFactor(incoming.unit)/unitFactor(match.unit),quantity=incoming.qty*factor;
   let combinedQuantity=Math.round((match.qty+quantity)*100)/100,combinedUnit=match.unit||'';
   if(combinedQuantity>999&&['g','ml'].includes(unitKey(combinedUnit))){combinedQuantity=Math.round(combinedQuantity/1000*100)/100;combinedUnit=unitKey(combinedUnit)==='g'?'kg':'l'}
   if(combinedQuantity<=999){
    const total=match.qty*match.price+incoming.qty*incoming.price;
    match.qty=combinedQuantity;match.unit=combinedUnit;match.price=total/match.qty;merged++;continue;
   }
  }
  next.push({...incoming,id:crypto.randomUUID()});added++;
 }
 return {items:next,added,merged,skipped,resetPrices};
}
function unitFactor(unit){return ({kg:1000,g:1,l:1000,ml:1})[unitKey(unit)]||1}
function compatibleUnits(a,b){
 const x=unitKey(a),y=unitKey(b);
 return x===y||(['g','kg'].includes(x)&&['g','kg'].includes(y))||(['ml','l'].includes(x)&&['ml','l'].includes(y));
}
function suggestPantryMeals(pantry){
 const available=new Set(pantry.map(canonicalIngredient));
 return templates.map((recipe,index)=>{
  const ingredients=recipe[4].map(value=>value.split('|')[0]),missing=ingredients.filter(name=>!available.has(canonicalIngredient(name)));
  return {index,total:ingredients.length,missing,matched:ingredients.length-missing.length};
 }).filter(result=>result.matched>0).sort((a,b)=>b.matched/b.total-a.matched/a.total||a.missing.length-b.missing.length).slice(0,6);
}
function cleanPlanningItem(item,{shared=false}={}){
 if(!item||typeof item.name!=='string'||!item.name.trim()||item.name.length>80||!categories.includes(item.category)||!Number.isFinite(item.qty)||item.qty<0.01||item.qty>999||!Number.isFinite(item.price)||item.price<0||item.price>999999999||typeof (item.unit||'')!=='string'||(item.unit||'').length>20||!planningCurrencies.includes(item.priceCurrency))throw Error('INVALID_ITEM');
 const result={id:typeof item.id==='string'&&item.id.length<=100?item.id:crypto.randomUUID(),name:item.name.trim(),category:item.category,qty:item.qty,price:item.price,priceCurrency:item.priceCurrency,unit:item.unit||'',done:shared?false:item.done===true};
 if(typeof item.templateIngredient==='string'&&Object.hasOwn(ingredientEnglish,item.templateIngredient))result.templateIngredient=item.templateIngredient;
 if(!shared&&Number.isFinite(item.actualPrice)&&item.actualPrice>=0&&item.actualPrice<=999999999&&planningCurrencies.includes(item.actualCurrency)){result.actualPrice=item.actualPrice;result.actualCurrency=item.actualCurrency}
 return result;
}
function validatePlanningBackup(data){
 if(!data||data.format!=='smolbasket'||data.version!==1||!data.shopping||!Array.isArray(data.shopping.items)||data.shopping.items.length>1000||!Array.isArray(data.templates)||data.templates.length>100||!Array.isArray(data.pantry)||data.pantry.length>200)throw Error('INVALID_BACKUP');
 const shop=data.shopping;
 if(!planningCurrencies.includes(shop.currency)||!planningCurrencies.includes(shop.budgetCurrency)||!Number.isFinite(shop.budget)||shop.budget<0||shop.budget>999999999||!['vi','en'].includes(shop.language))throw Error('INVALID_BACKUP');
 const seen=new Set();
 const items=shop.items.map(item=>{const clean=cleanPlanningItem(item);if(seen.has(clean.id))clean.id=crypto.randomUUID();seen.add(clean.id);return clean});
 const meals=data.templates.map(meal=>{
  if(!meal||typeof meal.name!=='string'||!meal.name.trim()||meal.name.length>80||!planningCurrencies.includes(meal.currency)||!Number.isInteger(meal.servings||1)||(meal.servings||1)<1||(meal.servings||1)>20||!Array.isArray(meal.items)||!meal.items.length||meal.items.length>500)throw Error('INVALID_TEMPLATE');
  return {id:crypto.randomUUID(),name:meal.name.trim(),currency:meal.currency,servings:meal.servings||1,items:meal.items.map(item=>cleanPlanningItem(item))};
 });
 const pantry=data.pantry.map(name=>{if(typeof name!=='string'||!name.trim()||name.length>80)throw Error('INVALID_PANTRY');return name.trim()});
 const history=Array.isArray(shop.purchaseHistory)?shop.purchaseHistory.slice(-500).map(entry=>{
  if(!entry||typeof entry.itemId!=='string'||typeof entry.name!=='string'||entry.name.length>80||!Number.isFinite(entry.actualUnitPrice)||entry.actualUnitPrice<0||!planningCurrencies.includes(entry.currency)||!Number.isFinite(Date.parse(entry.purchasedAt)))throw Error('INVALID_HISTORY');
  return {itemId:entry.itemId,name:entry.name,unit:typeof entry.unit==='string'?entry.unit.slice(0,20):'',key:typeof entry.key==='string'?entry.key.slice(0,150):'',actualUnitPrice:entry.actualUnitPrice,currency:entry.currency,purchasedAt:entry.purchasedAt,active:entry.active===true};
 }):[];
 return {format:'smolbasket',version:1,shopping:{items,budget:shop.budget,budgetCurrency:shop.budgetCurrency,currency:shop.currency,language:shop.language,purchaseHistory:history},templates:meals,pantry:[...new Set(pantry)]};
}
function encodeSharedList(items){
 const data={format:'smolbasket-list',version:1,items:items.map(item=>cleanPlanningItem(item,{shared:true}))};
 const bytes=new TextEncoder().encode(JSON.stringify(data));
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 const encoded=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 if(encoded.length>24000)throw Error('SHARE_TOO_LARGE');return encoded;
}
function decodeSharedList(encoded){
 if(typeof encoded!=='string'||encoded.length>24000||!/^[A-Za-z0-9_-]+$/.test(encoded))throw Error('INVALID_SHARE');
 const binary=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
 if(data.format!=='smolbasket-list'||data.version!==1||!Array.isArray(data.items)||!data.items.length||data.items.length>1000)throw Error('INVALID_SHARE');
 return data.items.map(item=>cleanPlanningItem(item,{shared:true}));
}
