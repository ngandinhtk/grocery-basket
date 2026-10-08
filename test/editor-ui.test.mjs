import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.listeners={};this.attributes={};this.value='';this.textContent='';this.className='';this.type='';this.parent=null;this.classList={add:name=>{this.className=name}}}
 append(...children){for(const child of children){child.parent=this;this.children.push(child)}}
 insertBefore(child,reference){child.parent=this;const index=this.children.indexOf(reference);this.children.splice(index<0?this.children.length:index,0,child)}
 replaceWith(replacement){if(!this.parent)return;const siblings=this.parent.children,index=siblings.indexOf(this);replacement.parent=this.parent;siblings[index]=replacement;this.parent=null}
 querySelector(selector){return selector==='.item-name small'?this.detail:selector==='.item-name'?this.name:selector==='.delete'?this.deleteButton:null}
 addEventListener(type,callback){this.listeners[type]=callback}
 setAttribute(name,value){this.attributes[name]=value}
 closest(selector){for(let node=this;node;node=node.parent){if(selector==='.quick-price-target'&&node.className==='quick-price-target')return node;if(selector==='[data-id]'&&node.dataset.id)return node}return null}
 focus(){this.focused=true}
 select(){this.selected=true}
 checkValidity(){const value=Number(this.value);return this.value!==''&&Number.isFinite(value)&&value>=Number(this.min)&&value<=Number(this.max)}
 reportValidity(){this.reportedValidity=true}
}

test('quick price editing updates only the estimate and preserves its currency',()=>{
 const item={id:'milk-1',name:'Milk',category:'Dairy & eggs',qty:2,price:10,priceCurrency:'USD',unit:'bottle',done:false};
 const row=new Element();row.dataset.id=item.id;row.detail=new Element('small');row.name=new Element();row.deleteButton=new Element('button');row.append(row.detail,row.name,row.deleteButton);
 const nodes=new Map(),itemsNode=new Element(),saves=[],notices=[];
 const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)},createElement:tag=>new Element(tag),querySelectorAll:selector=>selector==='.item'?[row]:[]};
 const context=vm.createContext({document,state:{items:[item],currency:'VND',purchaseHistory:[]},categories:['Produce','Dairy & eggs','Meat & seafood','Bakery','Pantry','Frozen','Household'],viCategories:[],tr:(english,vietnamese)=>vietnamese,save(){saves.push(true)},notify:message=>notices.push(message),money:(value,currency)=>`${currency} ${value}`,console});
 vm.runInContext(`const $=id=>document.getElementById(id);function render(){}`,context);
 nodes.set('items',itemsNode);
 vm.runInContext(fs.readFileSync('dist/editor.js','utf8'),context);
 assert.equal(row.detail.className,'quick-price-target');
 assert.equal(row.detail.attributes.role,'button');
 assert.equal(row.children.some(child=>child.className==='edit-button'),false);
 itemsNode.listeners.click({target:row.detail});
 const editor=row.children.find(child=>child.className==='quick-price-editor');
 const input=editor.children.find(child=>child.tagName==='INPUT');
 assert.equal(input.value,10);
 assert.equal(input.focused,true);
 input.value='12.5';
 input.listeners.keydown({key:'Enter',preventDefault(){}});
 assert.equal(item.price,12.5);
 assert.equal(item.priceCurrency,'USD');
 assert.equal(saves.length,1);
 assert.match(notices[0],/cập nhật giá/);
});
