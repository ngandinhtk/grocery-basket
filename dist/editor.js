let editingId=null;
const validCurrencies=['USD','VND','EUR','GBP'];
const actualPriceLabel=document.createElement('label'),actualPriceCaption=document.createElement('span'),actualPriceInput=document.createElement('input'),actualPriceNote=document.createElement('small'),purchaseHistoryNote=document.createElement('p');
actualPriceCaption.id='edit-label-actual-price';actualPriceInput.id='edit-actual-price';actualPriceInput.type='number';actualPriceInput.min='0';actualPriceInput.max='999999999';actualPriceInput.step='0.01';actualPriceInput.inputMode='decimal';actualPriceNote.id='edit-actual-price-note';purchaseHistoryNote.id='edit-purchase-history';
actualPriceLabel.append(actualPriceCaption,actualPriceInput,actualPriceNote);
$('edit-form').insertBefore(actualPriceLabel,$('edit-error'));$('edit-form').insertBefore(purchaseHistoryNote,$('edit-error'));
function moneyForCurrency(amount,currency){return new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits:currency==='VND'?0:2}).format(amount)}
function normalizedPurchaseKey(name,unit){return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`}
function recordActualPurchases(){
 if(!Array.isArray(state.purchaseHistory))state.purchaseHistory=[];
 for(const item of state.items){
  const latest=state.purchaseHistory.filter(x=>x.itemId===item.id).sort((a,b)=>Date.parse(b.purchasedAt)-Date.parse(a.purchasedAt))[0];
  if(!item.done){if(latest)latest.active=false;continue}
  if(!Number.isFinite(item.actualPrice)||item.actualPrice<0||!validCurrencies.includes(item.actualCurrency))continue;
  const record=latest?.active?latest:{itemId:item.id,purchasedAt:new Date().toISOString(),active:true};
  Object.assign(record,{name:item.name,unit:item.unit||'',key:normalizedPurchaseKey(item.name,item.unit||''),actualUnitPrice:item.actualPrice,currency:item.actualCurrency,estimatedUnitPrice:item.price});
  if(!latest?.active)state.purchaseHistory.push(record);
 }
 state.purchaseHistory=state.purchaseHistory.slice(-500);
}
function updateIngredient(id,values){
 const item=state.items.find(x=>x.id===id),name=String(values.name||'').trim(),unit=String(values.unit||'').trim();
 const qty=Number(values.qty),price=values.price===''?0:Number(values.price),hasActualPrice=Object.hasOwn(values,'actualPrice'),actualPrice=values.actualPrice===''||values.actualPrice==null?null:Number(values.actualPrice);
 if(!item||!name||name.length>80||unit.length>20||!categories.includes(values.category)||!Number.isFinite(qty)||qty<0.01||qty>999||!Number.isFinite(price)||price<0||price>999999999||(hasActualPrice&&actualPrice!==null&&(!Number.isFinite(actualPrice)||actualPrice<0||actualPrice>999999999)))return false;
 Object.assign(item,{name,category:values.category,qty,price,unit});
 if(hasActualPrice){if(actualPrice===null){delete item.actualPrice;delete item.actualCurrency}else{const unchanged=actualPrice===item.actualPrice;item.actualPrice=actualPrice;if(!unchanged||!validCurrencies.includes(item.actualCurrency))item.actualCurrency=state.currency}}
 save();return true;
}
function openIngredientEditor(id){
 const item=state.items.find(x=>x.id===id);if(!item)return;editingId=id;
 $('edit-title').textContent=tr('Edit ingredient','Sửa nguyên liệu');
 ['name','category','qty','unit','price'].forEach(key=>$(`edit-${key}`).value=item[key]??'');
 $('edit-actual-price').value=item.actualPrice??'';
 const previous=state.purchaseHistory.filter(x=>x.itemId!==item.id&&x.key===normalizedPurchaseKey(item.name,item.unit||'')&&x.currency===state.currency).sort((a,b)=>Date.parse(b.purchasedAt)-Date.parse(a.purchasedAt))[0];
 $('edit-purchase-history').textContent=previous?tr(`Previous actual price: ${moneyForCurrency(previous.actualUnitPrice,previous.currency)} per ${previous.unit||'unit'} (${new Date(previous.purchasedAt).toLocaleDateString()}).`,`Giá thực tế lần trước: ${moneyForCurrency(previous.actualUnitPrice,previous.currency)} / ${previous.unit||'đơn vị'} (${new Date(previous.purchasedAt).toLocaleDateString()}).`):tr('No previous purchase recorded for this item and currency.','Chưa có lần mua trước được ghi nhận cho mặt hàng và đơn vị tiền này.');
 $('edit-category').innerHTML=categories.map((c,i)=>`<option value="${c}">${tr(c,viCategories[i])}</option>`).join('');$('edit-category').value=item.category;
 ['name','category','qty','unit','price'].forEach((key,i)=>$(`edit-label-${key}`).textContent=tr(['Ingredient name','Category','Quantity','Unit (optional)','Unit price'][i],['Tên nguyên liệu','Nhóm thực phẩm','Số lượng','Đơn vị (tùy chọn)','Đơn giá'][i]));
 $('edit-unit').placeholder=tr('e.g. kg, bunch, pack','Ví dụ: kg, bó, gói');
 $('edit-price-note').textContent=tr(`Estimated price in ${state.currency} per unit. Leave blank if unknown.`,`Giá ước tính theo ${state.currency} cho mỗi đơn vị. Có thể để trống nếu chưa biết.`);
 $('edit-label-actual-price').textContent=tr(`Actual price paid (${state.currency} per unit)`,`Giá thực tế đã trả (${state.currency} mỗi đơn vị)`);
 $('edit-actual-price').placeholder=tr('Leave blank until purchased','Để trống đến khi mua');
 $('edit-actual-price-note').textContent=tr('Recorded separately from the estimate when the item is in your basket.','Được lưu riêng với giá ước tính sau khi đánh dấu đã mua.');
 $('edit-cancel').textContent=tr('Cancel','Hủy');$('edit-save').textContent=tr('Save changes','Lưu thay đổi');
 $('edit-error').textContent='';$('ingredient-editor').showModal();$('edit-name').focus();
}
const renderBeforeEditor=render;
const saveBeforePurchaseHistory=save;
save=function(){recordActualPurchases();saveBeforePurchaseHistory()};
render=function(){renderBeforeEditor();document.querySelectorAll('.item').forEach(row=>{const item=state.items.find(x=>x.id===row.dataset.id);if(!item)return;
 const button=document.createElement('button');button.type='button';button.className='edit-button';button.dataset.action='edit';button.textContent=tr('Edit','Sửa');button.setAttribute('aria-label',`${tr('Edit','Sửa')} ${item.name}`);row.insertBefore(button,row.querySelector('.delete'));
 if(item.unit){row.querySelector('.item-name small').textContent=item.price?`${money(item.price)} / ${item.unit}`:tr(`No price · ${item.unit}`,`Chưa có giá · ${item.unit}`)}
 if(Number.isFinite(item.actualPrice)&&validCurrencies.includes(item.actualCurrency)){const paid=document.createElement('small');paid.className='actual-price-note';paid.textContent=tr(`Actual price: ${moneyForCurrency(item.actualPrice,item.actualCurrency)} / ${item.unit||'unit'}`,`Giá thực tế: ${moneyForCurrency(item.actualPrice,item.actualCurrency)} / ${item.unit||'đơn vị'}`);row.querySelector('.item-name').append(paid)}
});const purchased=state.items.filter(x=>x.done&&Number.isFinite(x.actualPrice)&&x.actualPrice>=0&&x.actualCurrency===state.currency);if(purchased.length){const actual=purchased.reduce((sum,x)=>sum+x.actualPrice*x.qty,0),estimate=purchased.reduce((sum,x)=>sum+x.price*x.qty,0),difference=actual-estimate,comparison=difference===0?tr('matches the estimate','bằng giá ước tính'):difference>0?tr(`${money(difference)} over estimate`,`cao hơn ước tính ${money(difference)}`):tr(`${money(-difference)} under estimate`,`thấp hơn ước tính ${money(-difference)}`);$('budget-message').textContent+=`\n${tr(`Actual spend (${purchased.length} items): ${money(actual)} — ${comparison}`,`Đã chi thực tế (${purchased.length} món): ${money(actual)} — ${comparison}`)}`}};
 $('items').addEventListener('click',e=>{const button=e.target.closest('[data-action="edit"]');if(button)openIngredientEditor(button.closest('[data-id]').dataset.id)});
 $('edit-cancel').addEventListener('click',()=>$('ingredient-editor').close());
 $('ingredient-editor').addEventListener('close',()=>editingId=null);
 $('edit-form').addEventListener('submit',e=>{e.preventDefault();if(!$('edit-form').reportValidity())return;
 const values=Object.fromEntries(['name','category','qty','unit','price','actual-price'].map(key=>[key==='actual-price'?'actualPrice':key,$(`edit-${key}`).value]));
 if(updateIngredient(editingId,values)){$('ingredient-editor').close();notify(tr('Ingredient updated','Đã cập nhật nguyên liệu'))}else $('edit-error').textContent=tr('Check the name, quantity and price, then try again.','Kiểm tra tên, số lượng và giá rồi thử lại.');
 });
 render();
