import fs from 'node:fs';
import path from 'node:path';
const assets={};
for(const filename of fs.readdirSync('dist')){
 if(!/\.(html|js|css|svg)$/.test(filename))continue;
 const type=filename.endsWith('.html')?'text/html':filename.endsWith('.css')?'text/css':filename.endsWith('.svg')?'image/svg+xml':'text/javascript';
 assets['/'+filename]={body:fs.readFileSync(path.join('dist',filename),'utf8'),type:type+'; charset=utf-8'};
}
const source=fs.readFileSync('worker/index.mjs','utf8');
fs.mkdirSync('dist/server',{recursive:true});
fs.writeFileSync('dist/server/index.js',`const assets=${JSON.stringify(assets)};\n${source}`);
console.log(`Built Basket Worker with ${Object.keys(assets).length} browser assets.`);
