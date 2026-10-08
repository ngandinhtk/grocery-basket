let editingId=null;
function updateIngredient(id,values){
 const item=state.items.find(x=>x.id===id),name=String(values.name||'').trim(),unit=String(values.unit||'').trim();
 const qty=Number(values.qty),price=values.price===''?0:Number(values.price);
 if(!item||!name||name.length>80||unit.length>20||!categories.includes(values.category)||!Number.isFinite(qty)||qty<0.01||qty>999||!Number.isFinite(price)||price<0||price>999999999)return false;
 Object.assign(item,{name,category:values.category,qty,price,unit});save();return true;
}
function openIngredientEditor(id){
 const item=state.items.find(x=>x.id===id);if(!item)return;editingId=id;
 $('edit-title').textContent=tr('Edit ingredient','Sửa nguyên liệu');
 ['name','category','qty','unit','price'].forEach(key=>$(`edit-${key}`).value=item[key]??'');
 $('edit-category').innerHTML=categories.map((c,i)=>`<option value="${c}">${tr(c,viCategories[i])}</option>`).join('');$('edit-category').value=item.category;
 ['name','category','qty','unit','price'].forEach((key,i)=>$(`edit-label-${key}`).textContent=tr(['Ingredient name','Category','Quantity','Unit (optional)','Unit price'][i],['Tên nguyên liệu','Nhóm thực phẩm','Số lượng','Đơn vị (tùy chọn)','Đơn giá'][i]));
 $('edit-unit').placeholder=tr('e.g. kg, bunch, pack','Ví dụ: kg, bó, gói');
 $('edit-price-note').textContent=tr(`Price in ${state.currency} per unit. Leave blank if unknown.`,`Giá theo ${state.currency} cho mỗi đơn vị. Có thể để trống nếu chưa biết.`);
 $('edit-cancel').textContent=tr('Cancel','Hủy');$('edit-save').textContent=tr('Save changes','Lưu thay đổi');
 $('edit-error').textContent='';$('ingredient-editor').showModal();$('edit-name').focus();
}
const renderBeforeEditor=render;
render=function(){renderBeforeEditor();document.querySelectorAll('.item').forEach(row=>{const item=state.items.find(x=>x.id===row.dataset.id);if(!item)return;
 const button=document.createElement('button');button.type='button';button.className='edit-button';button.dataset.action='edit';button.textContent=tr('Edit','Sửa');button.setAttribute('aria-label',`${tr('Edit','Sửa')} ${item.name}`);row.insertBefore(button,row.querySelector('.delete'));
 if(item.unit){row.querySelector('.item-name small').textContent=item.price?`${money(item.price)} / ${item.unit}`:tr(`No price · ${item.unit}`,`Chưa có giá · ${item.unit}`)}
})};
 $('items').addEventListener('click',e=>{const button=e.target.closest('[data-action="edit"]');if(button)openIngredientEditor(button.closest('[data-id]').dataset.id)});
 $('edit-cancel').addEventListener('click',()=>$('ingredient-editor').close());
 $('ingredient-editor').addEventListener('close',()=>editingId=null);
 $('edit-form').addEventListener('submit',e=>{e.preventDefault();if(!$('edit-form').reportValidity())return;
 const values=Object.fromEntries(['name','category','qty','unit','price'].map(key=>[key,$(`edit-${key}`).value]));
 if(updateIngredient(editingId,values)){$('ingredient-editor').close();notify(tr('Ingredient updated','Đã cập nhật nguyên liệu'))}else $('edit-error').textContent=tr('Check the name, quantity and price, then try again.','Kiểm tra tên, số lượng và giá rồi thử lại.');
 });
 render();
