let pantryItems=[];
try{const saved=JSON.parse(localStorage.getItem('basket-pantry-v1'));if(Array.isArray(saved))pantryItems=saved.filter(name=>typeof name==='string'&&name.trim()&&name.length<=80).slice(0,200)}catch{}
let planningDraft=null,planningExcluded=new Set(),templateEditId=null,templateEditItems=[],pendingBackup=null,pendingShared=null,offlineReady=false;
const planningPanel=document.createElement('section');planningPanel.className='planning-panel';
planningPanel.innerHTML=`<div class="planning-settings"><label for="planning-servings" id="planning-servings-label"></label><input id="planning-servings" type="number" min="1" max="20" step="1" value="2"><label for="planning-merge" id="planning-merge-label"></label><select id="planning-merge"><option value="merge"></option><option value="skip"></option><option value="separate"></option></select></div><section class="pantry-panel"><h2 id="pantry-title"></h2><p id="pantry-note"></p><form id="pantry-form"><label for="pantry-input" class="sr" id="pantry-input-label"></label><textarea id="pantry-input" maxlength="16000" rows="4"></textarea><button type="submit" class="primary" id="pantry-save"></button></form><h3 id="pantry-ideas-title"></h3><div id="pantry-ideas"></div></section>`;
$('recipes-panel').insertBefore(planningPanel,$('recipes-panel').firstChild);
$('pantry-input').value=pantryItems.join('\n');
const groceryTools=document.createElement('section');groceryTools.className='grocery-tools';
groceryTools.innerHTML=`<h2 id="grocery-tools-title"></h2><div class="grocery-tool-actions"><button type="button" class="outline" id="planning-share"></button><button type="button" class="outline" id="planning-export"></button><label class="outline file-button" for="planning-import" id="planning-import-label"></label><input id="planning-import" type="file" accept=".json,application/json" class="sr"></div><p id="planning-share-note"></p><p id="offline-status" role="status"></p><div id="share-link-area" hidden><label for="planning-share-link" id="planning-share-link-label"></label><input id="planning-share-link" readonly><button type="button" class="outline" id="planning-copy-link"></button></div>`;
$('shopping-panel').append(groceryTools);
const planningDialog=document.createElement('dialog');planningDialog.id='planning-preview';planningDialog.className='planning-dialog';
planningDialog.innerHTML=`<h2 id="planning-preview-title"></h2><p id="planning-preview-note"></p><p id="planning-preview-warning" role="alert"></p><div id="planning-preview-items"></div><div class="planning-dialog-actions"><button type="button" class="outline" id="planning-preview-cancel"></button><button type="button" class="primary" id="planning-preview-add"></button></div>`;
document.body.append(planningDialog);
const editingDialog=document.createElement('dialog');editingDialog.id='local-template-editor';editingDialog.className='planning-dialog';
editingDialog.innerHTML=`<form id="local-template-edit-form"><h2 id="local-template-edit-title"></h2><label for="local-template-edit-name" id="local-template-edit-name-label"></label><input id="local-template-edit-name" maxlength="80" required><label for="local-template-edit-servings" id="local-template-edit-servings-label"></label><input id="local-template-edit-servings" type="number" min="1" max="20" step="1" required><p id="local-template-edit-note"></p><div id="local-template-edit-items"></div><button type="button" class="outline" id="local-template-edit-new"></button><p id="local-template-edit-error" role="alert"></p><div class="planning-dialog-actions"><button type="button" class="outline" id="local-template-edit-cancel"></button><button type="submit" class="primary" id="local-template-edit-save"></button></div></form>`;
document.body.append(editingDialog);
const transferDialog=document.createElement('dialog');transferDialog.id='planning-transfer';transferDialog.className='planning-dialog';
transferDialog.innerHTML=`<h2 id="planning-transfer-title"></h2><p id="planning-transfer-note"></p><div id="planning-transfer-summary"></div><div class="planning-dialog-actions"><button type="button" class="outline" id="planning-transfer-cancel"></button><button type="button" class="primary" id="planning-transfer-confirm"></button></div>`;
document.body.append(transferDialog);
function planningServings(){const number=Number($('planning-servings').value);if(!Number.isInteger(number)||number<1||number>20)throw Error('INVALID_SERVINGS');return number}
function openPlanningMeal(meal){
 try{
  planningDraft=scaleMeal(meal,planningServings());
  planningExcluded=new Set(planningDraft.items.map((item,index)=>pantryItems.some(name=>canonicalIngredient(name)===canonicalIngredient(item.name))?index:-1).filter(index=>index>=0));
  renderPlanningPreview();planningDialog.showModal();
 }catch{notify(tr('Choose 1–20 people. Scaled quantities must fit the list limit.','Chọn từ 1–20 người. Số lượng sau khi nhân phải nằm trong giới hạn danh sách.'))}
}
const applyTemplateBeforePlanning=applyTemplate;
applyTemplate=function(index){try{openPlanningMeal(recipeMeal(index))}catch{notify(tr('Could not open this template.','Không thể mở mẫu này.'))}};
function renderPlanningPreview(){
 if(!planningDraft)return;
 $('planning-preview-title').textContent=planningDraft.name;
 $('planning-preview-note').textContent=tr(`For ${planningDraft.servings} people. Check ingredients you already have to leave them off your list.`,`Cho ${planningDraft.servings} người. Đánh dấu nguyên liệu đã có để bỏ qua khi thêm vào danh sách.`);
 $('planning-preview-warning').textContent=planningDraft.reference?tr('These are rough shopping quantities, not a tested recipe. Adjust them in your list to suit your meal.','Đây là lượng mua tham khảo, chưa phải công thức nấu ăn đã kiểm chứng. Bạn có thể chỉnh lượng trong danh sách theo nhu cầu.'):'';
 $('planning-preview-items').innerHTML=planningDraft.items.map((item,index)=>`<label class="planning-ingredient"><input type="checkbox" data-planning-have="${index}" ${planningExcluded.has(index)?'checked':''}><span>${escapeHTML(planningItemName(item))}<small>${item.qty} ${escapeHTML(planningUnit(item.unit))} · ${tr('Have at home','Đã có ở nhà')}</small></span></label>`).join('');
 $('planning-preview-cancel').textContent=tr('Cancel','Hủy');$('planning-preview-add').textContent=tr('Add selected ingredients','Thêm nguyên liệu còn thiếu');
}
$('planning-preview-items').addEventListener('change',event=>{const box=event.target.closest('[data-planning-have]');if(!box)return;const index=Number(box.dataset.planningHave);if(box.checked)planningExcluded.add(index);else planningExcluded.delete(index)});
$('planning-preview-cancel').addEventListener('click',()=>planningDialog.close());
$('planning-preview-add').addEventListener('click',()=>{
 if(!planningDraft)return;
 const meal={...planningDraft,items:planningDraft.items.filter((_,index)=>!planningExcluded.has(index))};
 const result=mergePlanningItems(state.items,meal,{mode:$('planning-merge').value,currency:state.currency});
 state.items=result.items;filter='all';save();planningDialog.close();showMainTab('shopping');
 notify(tr(`${result.added} added, ${result.merged} combined, ${result.skipped} skipped.`,`Đã thêm ${result.added}, gộp ${result.merged}, bỏ qua ${result.skipped} nguyên liệu.`)+(result.resetPrices?tr(' Foreign-currency prices were cleared.',' Giá theo tiền tệ khác đã được xóa.'):''));planningDraft=null;
});
$('pantry-form').addEventListener('submit',event=>{
 event.preventDefault();const next=[...new Set($('pantry-input').value.split(/\n|,/).map(name=>name.trim()).filter(Boolean))];
 if(next.length>200||next.some(name=>name.length>80)){notify(tr('Use up to 200 ingredients, with names up to 80 characters.','Tối đa 200 nguyên liệu, tên mỗi nguyên liệu tối đa 80 ký tự.'));return}
 try{localStorage.setItem('basket-pantry-v1',JSON.stringify(next));pantryItems=next;renderPantryIdeas();notify(tr('Pantry saved.','Đã lưu đồ có ở nhà.'))}catch{notify(tr('Could not save your pantry.','Không thể lưu đồ có ở nhà.'))}
});
function renderPantryIdeas(){
 const suggestions=suggestPantryMeals(pantryItems);
 $('pantry-ideas').innerHTML=suggestions.length?suggestions.map(result=>{
  const recipe=templates[result.index];return `<article class="meal-card"><h3>${escapeHTML(tr(recipe[2],recipe[1]))}</h3><p>${tr(`${result.matched}/${result.total} ingredients at home`, `Có sẵn ${result.matched}/${result.total} nguyên liệu`)}</p><p>${result.missing.length?tr('Still need: ','Còn thiếu: ')+escapeHTML(result.missing.map(templateIngredientName).join(', ')):tr('You have all listed ingredients.','Bạn đã có đủ nguyên liệu trong mẫu.')}</p><button type="button" class="outline" data-pantry-recipe="${result.index}">${tr('Plan this meal','Chọn món này')}</button></article>`;
 }).join(''):`<p>${tr('Save the ingredients you have to see meal ideas.','Lưu nguyên liệu bạn có để xem gợi ý món ăn.')}</p>`;
}
$('pantry-ideas').addEventListener('click',event=>{const button=event.target.closest('[data-pantry-recipe]');if(button)applyTemplate(Number(button.dataset.pantryRecipe))});
function openLocalTemplateEditor(id){
 const meal=localTemplates.find(item=>item.id===id);if(!meal)return;
 templateEditId=id;templateEditItems=meal.items.map(item=>({...item}));
 $('local-template-edit-name').value=meal.name;$('local-template-edit-servings').value=meal.servings||1;$('local-template-edit-error').textContent='';
 renderTemplateEditorRows();renderPlanningText();editingDialog.showModal();
}
function renderTemplateEditorRows(){
 $('local-template-edit-items').innerHTML=templateEditItems.map((item,index)=>`<fieldset class="template-edit-row" data-edit-row="${index}"><legend>${tr('Ingredient','Nguyên liệu')} ${index+1}</legend><label>${tr('Name','Tên')}<input data-edit-field="name" value="${escapeHTML(item.name)}" maxlength="80" required></label><label>${tr('Category','Nhóm')}<select data-edit-field="category">${categories.map((category,i)=>`<option value="${escapeHTML(category)}" ${category===item.category?'selected':''}>${escapeHTML(tr(category,viCategories[i]))}</option>`).join('')}</select></label><label>${tr('Quantity','Số lượng')}<input data-edit-field="qty" type="number" min="0.01" max="999" step="0.01" value="${item.qty}" required></label><label>${tr('Unit','Đơn vị')}<input data-edit-field="unit" maxlength="20" value="${escapeHTML(item.unit||'')}"></label><label>${tr('Unit price','Đơn giá')}<input data-edit-field="price" type="number" min="0" max="999999999" step="any" value="${item.price}" required></label><label>${tr('Currency','Tiền tệ')}<select data-edit-field="priceCurrency">${planningCurrencies.map(currency=>`<option ${currency===(item.priceCurrency||state.currency)?'selected':''}>${currency}</option>`).join('')}</select></label><button type="button" class="text-button" data-edit-remove="${index}">${tr('Remove','Xóa')}</button></fieldset>`).join('');
}
$('local-template-list').addEventListener('click',event=>{const button=event.target.closest('[data-local-template-edit]');if(button)openLocalTemplateEditor(button.dataset.localTemplateEdit)});
$('local-template-edit-items').addEventListener('input',event=>{
 const field=event.target.dataset.editField,row=event.target.closest('[data-edit-row]');if(!row||!field)return;
 const item=templateEditItems[Number(row.dataset.editRow)];item[field]=['qty','price'].includes(field)?Number(event.target.value):event.target.value;
 if(field==='name')delete item.templateIngredient;
});
$('local-template-edit-items').addEventListener('click',event=>{const button=event.target.closest('[data-edit-remove]');if(button){templateEditItems.splice(Number(button.dataset.editRemove),1);renderTemplateEditorRows()}});
$('local-template-edit-new').addEventListener('click',()=>{if(templateEditItems.length>=500)return;templateEditItems.push({name:'',category:'Produce',qty:1,unit:'',price:0,priceCurrency:state.currency});renderTemplateEditorRows()});
$('local-template-edit-cancel').addEventListener('click',()=>editingDialog.close());
$('local-template-edit-form').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const name=$('local-template-edit-name').value.trim(),servings=Number($('local-template-edit-servings').value);
  if(!name||name.length>80||!Number.isInteger(servings)||servings<1||servings>20||!templateEditItems.length)throw Error('INVALID_TEMPLATE');
  const items=templateEditItems.map(item=>cleanPlanningItem(item));
  const next=localTemplates.map(meal=>meal.id===templateEditId?{...meal,name,servings,items}:meal);
  if(!persistLocalTemplates(next))return;
  renderLocalTemplates();editingDialog.close();notify(tr('Template updated.','Đã cập nhật mẫu.'));
 }catch{$('local-template-edit-error').textContent=tr('Check the name, people count and ingredient values. Keep at least one ingredient.','Kiểm tra tên, số người và thông tin nguyên liệu. Cần ít nhất một nguyên liệu.')}
});
function currentPlanningBackup(){return {format:'smolbasket',version:1,exportedAt:new Date().toISOString(),shopping:state,templates:localTemplates,pantry:pantryItems}}
function downloadPlanningFile(){
 const blob=new Blob([JSON.stringify(currentPlanningBackup(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='smolbasket-backup-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('planning-export').addEventListener('click',downloadPlanningFile);
$('planning-import').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{
  if(file.size>2000000)throw Error('TOO_LARGE');
  pendingBackup=validatePlanningBackup(JSON.parse(await file.text()));pendingShared=null;
  renderTransferDialog();transferDialog.showModal();
 }catch{pendingBackup=null;notify(tr('Invalid backup file. Choose a Smol Basket JSON backup under 2 MB.','File sao lưu không hợp lệ. Chọn file JSON sao lưu Smol Basket dưới 2 MB.'))}
 event.target.value='';
});
function renderTransferDialog(){
 $('planning-transfer-title').textContent=pendingShared?tr('Shared shopping list','Danh sách được chia sẻ'):tr('Restore backup','Khôi phục bản sao lưu');
 $('planning-transfer-note').textContent=pendingShared?tr('This is a copy of the sender’s list. Import it into yours; future changes are separate.','Đây là bản sao danh sách của người gửi. Nhập vào danh sách của bạn; thay đổi sau đó trên mỗi thiết bị là riêng.'):tr('Restoring replaces this device’s list, templates, pantry and budget. Export your current data first if you want to keep it.','Khôi phục sẽ thay thế danh sách, mẫu riêng, đồ có ở nhà và ngân sách trên thiết bị này. Xuất dữ liệu hiện tại trước nếu bạn muốn giữ lại.');
 const items=pendingShared||pendingBackup?.shopping.items||[];
 $('planning-transfer-summary').innerHTML=`<p>${items.length} ${tr('items','nguyên liệu')}${pendingBackup?` · ${pendingBackup.templates.length} ${tr('templates','mẫu')}`:''}</p>`+items.slice(0,50).map(item=>`<p>${escapeHTML(item.name)} × ${item.qty} ${escapeHTML(planningUnit(item.unit))}</p>`).join('');
 $('planning-transfer-cancel').textContent=tr('Cancel','Hủy');$('planning-transfer-confirm').textContent=pendingShared?tr('Add to my list','Thêm vào danh sách của tôi'):tr('Replace my data with this backup','Thay dữ liệu hiện tại bằng bản sao lưu');
}
$('planning-transfer-cancel').addEventListener('click',()=>{pendingBackup=null;pendingShared=null;transferDialog.close()});
$('planning-transfer-confirm').addEventListener('click',()=>{
 if(pendingShared){
  const result=mergePlanningItems(state.items,{currency:state.currency,items:pendingShared},{mode:'skip'});
  state.items=result.items;save();pendingShared=null;transferDialog.close();showMainTab('shopping');notify(tr('Shared list imported.','Đã nhập danh sách được chia sẻ.'));return;
 }
 if(!pendingBackup)return;
 const keys=['basket-v1','basket-templates-v1','basket-pantry-v1'],previous=keys.map(key=>localStorage.getItem(key));
 try{
  const values=[pendingBackup.shopping,pendingBackup.templates,pendingBackup.pantry];keys.forEach((key,index)=>localStorage.setItem(key,JSON.stringify(values[index])));
  state=pendingBackup.shopping;localTemplates=pendingBackup.templates;pantryItems=pendingBackup.pantry;
  filter='all';$('budget').value=state.budget;$('currency').value=state.currency;$('language').value=state.language;$('pantry-input').value=pantryItems.join('\n');
  render();transferDialog.close();pendingBackup=null;notify(tr('Backup restored.','Đã khôi phục bản sao lưu.'));
 }catch{
  keys.forEach((key,index)=>{try{if(previous[index]===null)localStorage.removeItem(key);else localStorage.setItem(key,previous[index])}catch{}});
  notify(tr('Could not restore the backup. Check browser storage and try again.','Không thể khôi phục. Kiểm tra bộ nhớ trình duyệt và thử lại.'));
 }
});
$('planning-share').addEventListener('click',async()=>{
 if(!state.items.length){notify(tr('Add items before sharing.','Thêm nguyên liệu trước khi chia sẻ.'));return}
 try{
  const url=new URL(window.location.origin+window.location.pathname);url.hash='list='+encodeSharedList(state.items);
  $('planning-share-link').value=url.href;$('share-link-area').hidden=false;
  if(navigator.share){try{await navigator.share({title:'Smol Basket',url:url.href})}catch(error){if(error.name!=='AbortError')notify(tr('Copy the link below to share.','Sao chép liên kết bên dưới để chia sẻ.'))}}
  else $('planning-share-link').select();
 }catch{notify(tr('This list is too long for a link. Export a backup file to share instead.','Danh sách quá dài để chia sẻ bằng liên kết. Hãy xuất file sao lưu để gửi.'))}
});
$('planning-copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('planning-share-link').value);notify(tr('Link copied.','Đã sao chép liên kết.'))}catch{$('planning-share-link').select();notify(tr('Select and copy the link manually.','Chọn và sao chép liên kết thủ công.'))}});
function renderPlanningText(){
 const labels={
  'planning-servings-label':['People for this meal','Số người ăn'], 'planning-merge-label':['When ingredients overlap','Khi nguyên liệu trùng'],
  'pantry-title':['What I have at home','Đồ có ở nhà'],'pantry-note':['Enter one ingredient per line. These ingredients are checked automatically in meal previews.','Nhập mỗi nguyên liệu một dòng. Những nguyên liệu này sẽ được tự đánh dấu trong phần xem trước món ăn.'],
  'pantry-input-label':['Ingredients at home','Nguyên liệu có ở nhà'],'pantry-save':['Save pantry','Lưu đồ có ở nhà'],'pantry-ideas-title':['Meals from your pantry','Gợi ý món từ đồ đang có'],
  'grocery-tools-title':['Share & backup','Chia sẻ & sao lưu'],'planning-share':['Share list','Chia sẻ danh sách'],'planning-export':['Export backup','Xuất bản sao lưu'],'planning-import-label':['Import backup','Nhập bản sao lưu'],
  'planning-share-note':['A shared link contains a copy of your list. Recipients can import it; changes do not sync between devices.','Liên kết chứa bản sao danh sách. Người nhận có thể nhập để dùng; thay đổi không đồng bộ giữa các thiết bị.'],
  'planning-share-link-label':['Share this link','Gửi liên kết này'],'planning-copy-link':['Copy link','Sao chép liên kết'],
  'local-template-edit-title':['Edit template','Sửa mẫu'],'local-template-edit-name-label':['Template name','Tên mẫu'],'local-template-edit-servings-label':['People this template serves','Số người ăn của mẫu'],
  'local-template-edit-note':['Quantities below are for the people count above. Prices are per unit.','Số lượng bên dưới dành cho số người ở trên. Giá là giá mỗi đơn vị.'],
  'local-template-edit-new':['Add ingredient','Thêm nguyên liệu'],'local-template-edit-cancel':['Cancel','Hủy'],'local-template-edit-save':['Save changes','Lưu thay đổi']
 };
 for(const [id,text] of Object.entries(labels))$(id).textContent=tr(...text);
 const options=$('planning-merge').options;
 const text=[['Combine quantities','Cộng số lượng'],['Skip duplicates','Bỏ qua nguyên liệu trùng'],['Keep separate','Giữ dòng riêng']];
 for(let index=0;index<options.length;index++)options[index].textContent=tr(...text[index]);
 $('offline-status').textContent=!navigator.onLine?tr('Offline — your list and templates still save on this device.','Đang offline — danh sách và mẫu vẫn được lưu trên thiết bị này.'):offlineReady?tr('Ready for offline shopping on this device.','Đã sẵn sàng dùng offline trên thiết bị này.'):tr('Open this site online once to prepare offline shopping.','Mở website khi có mạng một lần để chuẩn bị dùng offline.');
 renderPantryIdeas();
}
const renderBeforePlanning=render;render=function(){renderBeforePlanning();renderPlanningText()};
renderPlanningText();
if(window.location.hash.startsWith('#list=')){
 try{pendingShared=decodeSharedList(window.location.hash.slice(6));renderTransferDialog();transferDialog.showModal()}catch{notify(tr('This shared list link is invalid.','Liên kết danh sách này không hợp lệ.'))}
 window.history.replaceState(null,'',window.location.pathname+window.location.search);
}
window.addEventListener('online',renderPlanningText);window.addEventListener('offline',renderPlanningText);
if('serviceWorker' in navigator){
 navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;renderPlanningText()}).catch(()=>{offlineReady=false});
}
