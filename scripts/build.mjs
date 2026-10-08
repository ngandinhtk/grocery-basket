import fs from 'node:fs';
import path from 'node:path';
const donation=JSON.parse(fs.readFileSync('public/coffee-account.json','utf8'));
const qrImage='data:image/jpeg;base64,'+fs.readFileSync('public/bank-qr.jpg').toString('base64');
fs.writeFileSync('dist/coffee-bank.js',`const BANK_DONATION=${JSON.stringify({...donation,qrImage})};\n`);
const escapeAttribute=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const assets={};
for(const filename of fs.readdirSync('dist')){
 if(!/\.(html|js|css|svg)$/.test(filename))continue;
 const type=filename.endsWith('.html')?'text/html':filename.endsWith('.css')?'text/css':filename.endsWith('.svg')?'image/svg+xml':'text/javascript';
 assets['/'+filename]={body:fs.readFileSync(path.join('dist',filename),'utf8'),type:type+'; charset=utf-8'};
}
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assets['/index.html'].body=assets['/index.html'].body.replace('<div id="coffee-qr"></div>',`<div id="coffee-qr"><img src="${qrImage}" alt="VietQR — ${escapeAttribute(donation.bank)} ${escapeAttribute(donation.account)}"></div>`);
assets['/index.html'].body=assets['/index.html'].body.replace('<p id="coffee-details"></p>',`<p id="coffee-details">Ngân hàng: ${escapeText(donation.bank)}\nSố tài khoản: ${escapeText(donation.account)}${donation.owner?'\nChủ tài khoản: '+escapeText(donation.owner):''}</p>`);
const source=fs.readFileSync('worker/index.mjs','utf8');
const imageTypes={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml'};
function addPublicImages(folder,relative=''){
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Public assets must not contain symlinks.');
  const filename=path.join(folder,entry.name),route=path.posix.join(relative,entry.name);
  if(entry.isDirectory())addPublicImages(filename,route);
  else if(imageTypes[path.extname(entry.name).toLowerCase()])assets['/'+route]={body:fs.readFileSync(filename).toString('base64'),type:imageTypes[path.extname(entry.name).toLowerCase()],encoding:'base64'};
 }
}
if(fs.existsSync('public'))addPublicImages('public');
fs.mkdirSync('dist/server',{recursive:true});
fs.writeFileSync('dist/server/index.js',`const assets=${JSON.stringify(assets)};\n${source}`);
fs.mkdirSync('dist/.openai',{recursive:true});
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
console.log(`Built Basket Worker with ${Object.keys(assets).length} browser assets.`);
