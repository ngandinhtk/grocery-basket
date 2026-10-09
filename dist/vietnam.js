const viCategories=['Rau củ & trái cây','Sữa & trứng','Thịt & hải sản','Bánh mì','Thực phẩm khô','Đông lạnh','Đồ gia dụng'];
const tr=(en,vi)=>state.language==='vi'?vi:en;
const ingredientEnglish={'Gạo':'Rice','Thịt heo':'Pork','Trứng gà':'Eggs','Rau muống':'Water spinach','Tỏi':'Garlic','Nước mắm':'Fish sauce','Sữa tươi':'Milk','Thịt gà':'Chicken','Cà rốt':'Carrots','Cải xanh':'Mustard greens','Chuối':'Bananas','Đậu phụ':'Tofu','Nấm':'Mushrooms','Cải thìa':'Bok choy','Nước tương':'Soy sauce','Bánh mì':'Bread','Dưa leo':'Cucumber','Bánh phở':'Flat rice noodles','Thịt bò':'Beef','Xương bò':'Beef bones','Hành tây':'Onion','Gừng':'Ginger','Hành lá':'Spring onions','Rau thơm':'Fresh herbs','Gia vị phở':'Pho spices','Bún':'Rice vermicelli','Giò heo':'Pork hock','Sả':'Lemongrass','Mắm ruốc':'Fermented shrimp paste','Ớt':'Chilli','Đu đủ xanh':'Green papaya','Gạo tấm':'Broken rice','Sườn heo':'Pork ribs','Cà chua':'Tomatoes','Thịt ba chỉ':'Pork belly','Nước dừa':'Coconut water','Hành tím':'Shallots','Đường':'Sugar','Cá':'Fish','Dứa':'Pineapple','Đậu bắp':'Okra','Giá đỗ':'Bean sprouts','Me':'Tamarind','Rau ngổ':'Rice paddy herb','Bánh tráng':'Rice paper','Tôm':'Shrimp','Xà lách':'Lettuce','Tương đen':'Hoisin sauce','Bột bánh xèo':'Savory crepe mix','Nước cốt dừa':'Coconut milk','Bắp cải':'Cabbage','Rau răm':'Vietnamese coriander','Chanh':'Lime','Đậu phộng':'Peanuts','Tiêu':'Black pepper','Bí đỏ':'Pumpkin','Thịt heo xay':'Ground pork','Cải thảo':'Napa cabbage','Bắp non':'Baby corn','Khoai tây':'Potatoes','Bột cà ri':'Curry powder','Bột bánh xèo chay':'Vegetarian savory crepe mix'};
function templateIngredientName(name){return tr(ingredientEnglish[name]||name,name)}
const templates=[
 ['🍚','Bữa cơm gia đình','Family dinner','everyday',['Gạo|4','Thịt heo|2','Trứng gà|1','Rau muống|0','Tỏi|0','Nước mắm|4']],
 ['🥬','Đi chợ đầu tuần','Weekly essentials','everyday',['Gạo|4','Trứng gà|1','Sữa tươi|1','Thịt gà|2','Thịt heo|2','Cà rốt|0','Cải xanh|0','Chuối|0','Đậu phụ|4']],
 ['🌱','Bữa chay thanh đạm','Vegetarian meal','everyday',['Đậu phụ|4','Nấm|0','Cải thìa|0','Cà rốt|0','Gạo|4','Nước tương|4']],
 ['🥖','Bữa sáng nhanh','Quick breakfast','everyday',['Bánh mì|3','Trứng gà|1','Sữa tươi|1','Dưa leo|0','Chuối|0']],
 ['🍲','Phở bò','Beef pho','dish',['Bánh phở|4','Thịt bò|2','Xương bò|2','Hành tây|0','Gừng|0','Hành lá|0','Rau thơm|0','Gia vị phở|4']],
 ['🍜','Bún bò Huế','Hue beef noodle soup','dish',['Bún|4','Thịt bò|2','Giò heo|2','Sả|0','Mắm ruốc|4','Ớt|0','Hành lá|0','Rau thơm|0']],
 ['🍋','Bún chả','Grilled pork noodles','dish',['Bún|4','Thịt heo|2','Đu đủ xanh|0','Cà rốt|0','Rau thơm|0','Nước mắm|4','Tỏi|0']],
 ['🍳','Cơm tấm','Broken rice with pork','dish',['Gạo tấm|4','Sườn heo|2','Trứng gà|1','Dưa leo|0','Cà chua|0','Nước mắm|4']],
 ['🥘','Thịt kho trứng','Braised pork and eggs','dish',['Thịt ba chỉ|2','Trứng gà|1','Nước dừa|4','Nước mắm|4','Hành tím|0','Đường|4']],
 ['🐟','Canh chua cá','Sour fish soup','dish',['Cá|2','Cà chua|0','Dứa|0','Đậu bắp|0','Giá đỗ|0','Me|4','Rau ngổ|0']],
 ['🦐','Gỏi cuốn','Fresh spring rolls','dish',['Bánh tráng|4','Bún|4','Tôm|2','Thịt heo|2','Xà lách|0','Rau thơm|0','Tương đen|4']],
 ['🥞','Bánh xèo','Vietnamese savory crepes','dish',['Bột bánh xèo|4','Nước cốt dừa|4','Tôm|2','Thịt heo|2','Giá đỗ|0','Xà lách|0','Rau thơm|0']],
 ['🍗','Gà kho gừng','Ginger chicken','dish',['Thịt gà|2','Gừng|0','Hành tím|0','Nước mắm|4','Gạo|4']],
 ['🥗','Gỏi gà','Vietnamese chicken salad','dish',['Thịt gà|2','Bắp cải|0','Hành tây|0','Rau răm|0','Chanh|0','Đậu phộng|4']],
 ['🍅','Đậu phụ sốt cà chua','Tofu in tomato sauce','dish',['Đậu phụ|4','Cà chua|0','Hành lá|0','Nước tương|4','Gạo|4']],
 ['🥣','Cháo gà','Chicken rice porridge','dish',['Gạo|4','Thịt gà|2','Gừng|0','Hành lá|0','Hành tím|0']],
 ['🐠','Cá kho tộ','Clay pot braised fish','dish',['Cá|2','Thịt ba chỉ|2','Nước mắm|4','Hành tím|0','Tiêu|4','Gạo|4']],
 ['🍠','Canh bí đỏ','Pumpkin soup','dish',['Bí đỏ|0','Thịt heo xay|2','Hành lá|0','Hành tím|0']],
 ['🍝','Bún thịt nướng','Grilled pork noodle bowl','dish',['Bún|4','Thịt heo|2','Dưa leo|0','Rau thơm|0','Đậu phộng|4','Nước mắm|4']],
 ['🍲','Lẩu cuối tuần','Weekend hot pot','everyday',['Thịt bò|2','Tôm|2','Nấm|0','Cải thảo|0','Đậu phụ|4','Bún|4','Sả|0','Cà chua|0']]
];
templates.forEach((t,i)=>t[5]=[2,14].includes(i)?'vegetarian':'savory');
templates.push(
 ['🍄','Nấm kho tiêu','Pepper braised mushrooms','dish',['Nấm|0','Tiêu|4','Nước tương|4','Hành tím|0','Gạo|4'],'vegetarian'],
 ['🥬','Rau củ xào chay','Stir fried vegetables','dish',['Cải thìa|0','Cà rốt|0','Nấm|0','Bắp non|0','Nước tương|4'],'vegetarian'],
 ['🍲','Canh nấm đậu phụ','Mushroom and tofu soup','dish',['Đậu phụ|4','Nấm|0','Cà rốt|0','Hành lá|0'],'vegetarian'],
 ['🍜','Bún chay','Vegetarian noodle bowl','dish',['Bún|4','Đậu phụ|4','Nấm|0','Dưa leo|0','Rau thơm|0','Nước tương|4'],'vegetarian'],
 ['🥘','Cà ri chay','Vegetarian curry','dish',['Khoai tây|0','Cà rốt|0','Đậu phụ|4','Nước cốt dừa|4','Bột cà ri|4','Sả|0'],'vegetarian'],
 ['🥞','Bánh xèo chay','Vegetarian savory crepes','dish',['Bột bánh xèo chay|4','Nước cốt dừa|4','Nấm|0','Đậu phụ|4','Giá đỗ|0','Xà lách|0'],'vegetarian']
);
const phrases=[
 ['.tagline','A little planning. A better shop.','Chuẩn bị một chút. Đi chợ dễ hơn.'],
 ['#print','↗ Print list','↗ In danh sách'],['.intro .eyebrow','YOUR EVERYDAY SHOPPING COMPANION','BẠN ĐỒNG HÀNH MỖI LẦN ĐI CHỢ'],
 ['.intro h1','Good food starts<br>with a good list<span>.</span>','Bữa ngon bắt đầu<br>từ một danh sách tốt<span>.</span>'],
 ['.intro p','Less wandering the aisles. More of what you need.','Đi chợ gọn hơn. Mua đúng những gì bạn cần.'],
 ['.illustration div','fresh plans, full baskets','kế hoạch mới, giỏ đầy xanh'],
 ['.list-heading .eyebrow','LET’S GET ORGANIZED','CÙNG CHUẨN BỊ NÀO'],['.list-heading h2','My grocery list','Danh sách đi chợ'],
 ['label[for="name"]','Item name','Tên món cần mua'],['#add-form .primary','＋ Add item','＋ Thêm món'],
 ['[data-filter="all"]','All items','Tất cả'],['[data-filter="remaining"]','To buy','Cần mua'],['[data-filter="done"]','In basket','Đã mua'],
 ['#clear','Clear checked','Xóa món đã mua'],['#copy','Copy list','Sao chép'],
 ['.budget-card .eyebrow','A LITTLE PEACE OF MIND','CHI TIÊU THOẢI MÁI HƠN'],['.budget-card h2','Your shopping budget','Ngân sách đi chợ'],
 ['.total span','Estimated total','Tổng dự kiến'],['.stat:nth-of-type(6) span','Already in your basket','Đã mua'],
 ['.budget-card small','Estimates use the unit prices you enter. Taxes and store prices may vary.','Ước tính theo đơn giá bạn nhập. Giá thực tế có thể khác.'],
 ['.suggestions .eyebrow','THE USUAL GOOD STUFF','NHỮNG MÓN QUEN THUỘC'],['.suggestions h3','Forgot anything?','Bạn còn thiếu gì?'],
 ['.suggestions p','Tap a staple to add it to your list.','Bấm để thêm món thường mua vào danh sách.'],
 ['.tip p','<strong>A fresh little tip</strong><br>Check your fridge before you go. The best grocery is the one you already have.','<strong>Mẹo nhỏ đi chợ</strong><br>Kiểm tra tủ lạnh trước khi đi để tận dụng thực phẩm sẵn có.'],
 ['footer','Made for the everyday essentials.<span>Plan a little. Waste a little less.</span>','Dành cho bữa ăn mỗi ngày.<span>Chuẩn bị tốt hơn. Lãng phí ít hơn.</span>']
];
function localize(){
 document.documentElement.lang=state.language;
 document.title=tr('Basket · Grocery shopping','Basket · Đi chợ');
 phrases.forEach(([selector,en,vi])=>{const el=document.querySelector(selector);if(el)el.innerHTML=tr(en,vi)});
 $('name').placeholder=tr('What do you need?','Bạn cần mua gì?');
 document.querySelectorAll('.details label').forEach((el,i)=>{el.firstChild.textContent=tr(['Aisle','Quantity','Est. unit price'][i],['Nhóm thực phẩm','Số lượng','Đơn giá dự kiến'][i])});
 const selectedCategory=$('category').value;
 $('category').innerHTML=categories.map((c,i)=>`<option value="${c}">${tr(c,viCategories[i])}</option>`).join('');
 if(categories.includes(selectedCategory))$('category').value=selectedCategory;
 document.querySelector('.budget-label').firstChild.textContent=tr('Trip budget ','Ngân sách chuyến đi ');
 $('budget').setAttribute('aria-label',tr('Trip budget','Ngân sách chuyến đi'));
 $('currency').setAttribute('aria-label',tr('Currency','Tiền tệ'));
 document.querySelector('.tabs').setAttribute('aria-label',tr('Filter list','Lọc danh sách'));
 document.querySelectorAll('.stat span').forEach((el,i)=>el.textContent=tr(['Already in your basket','Still on your list'][i],['Đã mua','Còn cần mua'][i]));
 document.querySelector('.list-foot span').textContent=storageOK?tr('✓ Your list saves automatically on this device','✓ Danh sách tự lưu trên thiết bị này'):tr('Browser storage unavailable — copy your list before leaving','Không thể lưu trên trình duyệt — hãy sao chép danh sách');
 $('suggestions').innerHTML=(state.language==='vi'?[['🍚','Gạo','Pantry'],['🥚','Trứng gà','Dairy & eggs'],['🥬','Rau muống','Produce'],['🐟','Cá','Meat & seafood'],['🧄','Tỏi','Produce'],['🍶','Nước mắm','Pantry']]:staples).map(([icon,name,category])=>`<button data-quick-name="${name}" data-quick-category="${category}">${icon} ${name} ＋</button>`).join('');
 $('templates-title').textContent=tr('A little inspiration for your next shop','Gợi ý cho lần đi chợ tiếp theo');
 $('templates-note').textContent=tr('Choose a meal, then use Edit on any ingredient to change its name, quantity, unit or price. Add or remove ingredients to suit your meal.','Chọn món rồi bấm Sửa ở từng nguyên liệu để đổi tên, số lượng, đơn vị hoặc giá. Bạn có thể thêm và xóa nguyên liệu theo nhu cầu.');
 $('template-search').placeholder=tr('Search meals or ingredients…','Tìm món ăn hoặc nguyên liệu…');
 $('template-search').setAttribute('aria-label',tr('Search templates','Tìm mẫu đi chợ'));
 const selectedKind=$('template-kind').value;
 $('template-kind').innerHTML=`<option value="all">${tr('All templates','Tất cả mẫu')}</option><option value="everyday">${tr('Everyday shopping','Đi chợ hằng ngày')}</option><option value="dish">${tr('Vietnamese dishes','Món Việt Nam')}</option>`;
 $('template-kind').value=['all','everyday','dish'].includes(selectedKind)?selectedKind:'all';
 const selectedDiet=$('template-diet').value;
 $('template-diet').innerHTML=`<option value="all">${tr('All diets','Mặn & chay')}</option><option value="savory">${tr('Non-vegetarian','Món mặn')}</option><option value="vegetarian">${tr('Vegetarian','Món chay')}</option>`;
 $('template-diet').value=['savory','vegetarian'].includes(selectedDiet)?selectedDiet:'all';
 $('template-diet').setAttribute('aria-label',tr('Filter by diet','Lọc món mặn hoặc món chay'));
 $('template-kind').setAttribute('aria-label',tr('Filter template type','Lọc loại mẫu'));
 $('templates-count').textContent=tr(`${templates.length} templates`,`${templates.length} mẫu`);
 renderTemplates();
}
function renderTemplates(){const query=$('template-search').value.trim().toLocaleLowerCase(),kind=$('template-kind').value,diet=$('template-diet').value;
 const matches=templates.map((t,i)=>({t,i})).filter(({t})=>(kind==='all'||kind===t[3])&&(diet==='all'||diet===t[5])&&`${t[1]} ${t[2]} ${t[4].join(' ')} ${t[4].map(x=>ingredientEnglish[x.split('|')[0]]||'').join(' ')}`.toLocaleLowerCase().includes(query));
 $('template-grid').innerHTML=matches.length?matches.map(({t,i})=>`<article class="meal-card"><span class="meal-icon" aria-hidden="true">${t[0]}</span><div><h3>${escapeHTML(tr(t[2],t[1]))}</h3><p>${t[4].length} ${tr('ingredients','nguyên liệu')} · ${t[5]==='vegetarian'?tr('Vegetarian','Món chay'):tr('Non-vegetarian','Món mặn')}</p></div><details><summary>${tr('View ingredients','Xem nguyên liệu')}</summary><p>${escapeHTML(t[4].map(x=>templateIngredientName(x.split('|')[0])).join(', '))}</p></details><button class="outline" data-template="${i}">＋ ${tr('Add ingredients','Thêm nguyên liệu')}</button></article>`).join(''):`<p class="empty">${tr('No matching templates. Try another search.','Chưa có mẫu phù hợp. Thử từ khóa khác nhé.')}</p>`;
}
function applyTemplate(index){const template=templates[index];if(!template)return;let added=0;template[4].forEach(value=>{const [originalName,category]=value.split('|');const name=templateIngredientName(originalName);if(!state.items.some(x=>!x.done&&x.name.toLocaleLowerCase()===name.toLocaleLowerCase())){state.items.push({id:crypto.randomUUID(),name,templateIngredient:originalName,category:categories[Number(category)],qty:1,price:0,priceCurrency:state.currency,done:false});added++}});filter='all';save();notify(added?tr(`${added} ingredients added`, `Đã thêm ${added} nguyên liệu`):tr('These ingredients are already on your list','Các nguyên liệu này đã có trong danh sách'));}
const baseRender=render;
render=function(){state.items.forEach(item=>{if(item.templateIngredient&&[item.templateIngredient,ingredientEnglish[item.templateIngredient]].includes(item.name))item.name=templateIngredientName(item.templateIngredient)});baseRender();localize();if(state.language!=='vi')return;
 $('count').textContent=`Đã mua ${state.items.filter(x=>x.done).length}/${state.items.length} món`;
 document.querySelectorAll('.group-title span:first-child').forEach(el=>{const i=categories.indexOf(el.textContent);if(i>=0)el.textContent=viCategories[i]});
 document.querySelectorAll('.item-name small').forEach(el=>el.textContent=el.textContent.startsWith('No price added')?'Chưa có giá':el.textContent.replace(' each',' / đơn vị'));
 const estimates=state.items.filter(x=>x.priceCurrency===state.currency),total=estimates.reduce((n,x)=>n+x.price*x.qty,0),budgetMatches=state.budgetCurrency===state.currency,excluded=state.items.filter(x=>x.price>0&&x.priceCurrency!==state.currency).length;
 const budgetMessage=budgetMatches?(total>state.budget?`Vượt ngân sách ${money(total-state.budget)}`:`Còn ${money(state.budget-total)} trong ngân sách`):`Ngân sách đang theo ${state.budgetCurrency}; ước tính đang hiển thị bằng ${state.currency}. Hãy cập nhật ngân sách để so sánh.`;
 $('budget-message').textContent=budgetMessage+(excluded?`\n${excluded} món có giá theo tiền tệ khác và không được tính vào tổng.`:'');
 const empty=document.querySelector('#items .empty');if(empty)empty.innerHTML=state.items.length?(filter==='done'?'Chưa có món nào trong giỏ.<br>Đánh dấu món bạn đã mua.':'Bạn đã mua đủ rồi. Chúc bạn nấu ăn ngon!'):'Bữa ngon tiếp theo bắt đầu từ đây.<br>Thêm món cần mua hoặc chọn một mẫu bên dưới.';
 document.querySelectorAll('.item').forEach(row=>{const x=state.items.find(x=>x.id===row.dataset.id);row.querySelector('.check').setAttribute('aria-label',`${x.done?'Chuyển sang cần mua':'Đánh dấu đã mua'} ${x.name}`);row.querySelector('[data-action="minus"]').setAttribute('aria-label',`Giảm số lượng ${x.name}`);row.querySelector('[data-action="plus"]').setAttribute('aria-label',`Tăng số lượng ${x.name}`);row.querySelector('.delete').setAttribute('aria-label',`Xóa ${x.name}`)});
};
const baseNotify=notify;
notify=function(msg){const messages={'Added to your list':'Đã thêm vào danh sách','Currency changed. Existing item prices keep their original currency; new or edited prices use the selected currency.':'Đã đổi tiền tệ. Giá của các món hiện có giữ nguyên đơn vị cũ; giá mới hoặc được sửa sẽ dùng đơn vị vừa chọn.','Checked items cleared — click here to undo':'Đã xóa món đã mua — bấm để hoàn tác','Items restored':'Đã khôi phục các món','List copied':'Đã sao chép danh sách','Copy unavailable. Use Print list to save your list.':'Không thể sao chép. Hãy dùng In danh sách để lưu.'};baseNotify(tr(msg,messages[msg]||msg));};
state.language=state.language==='en'?'en':'vi';$('language').value=state.language;
money=(n,currency=state.currency)=>new Intl.NumberFormat(state.language==='vi'?'vi-VN':'en-US',{style:'currency',currency,maximumFractionDigits:currency==='VND'?0:2}).format(n);
 $('language').addEventListener('change',()=>{state.language=$('language').value;save()});
 $('suggestions').addEventListener('click',e=>{const b=e.target.closest('[data-quick-name]');if(b){add(b.dataset.quickName,b.dataset.quickCategory);notify(tr('Added to your list','Đã thêm vào danh sách'))}});
 $('template-search').addEventListener('input',renderTemplates);$('template-kind').addEventListener('change',renderTemplates);$('template-grid').addEventListener('click',e=>{const button=e.target.closest('[data-template]');if(button)applyTemplate(Number(button.dataset.template))});
 $('template-diet').addEventListener('change',renderTemplates);
 render();
