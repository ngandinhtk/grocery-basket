import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';

test('page metadata, favicon, copyright, and version use Basket branding',async()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 const icon=fs.readFileSync('public/favicon.svg','utf8');
 const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
 const response=await worker.fetch(new Request('https://basket.example/'),{});
 const servedHtml=await response.text();
 assert.match(html,/<title>Basket — Grocery shopping list<\/title>/);
 assert.match(html,/<meta name="description" content="Basket helps you plan meals/);
 assert.match(html,/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
 assert.match(html,/<span>© 2026 Basket<\/span>/);
 assert.ok(html.includes(`<span id="app-version">v${version}</span>`));
 assert.ok(servedHtml.includes(`<span id="app-version">v${version}</span>`));
 assert.match(icon,/fill="#214f38"/);
 assert.doesNotMatch(icon,/<text\b/);
});
