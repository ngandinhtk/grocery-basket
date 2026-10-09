import './build.mjs';
import fs from 'node:fs';
import path from 'node:path';
const { default: worker } = await import('../dist/server/index.js');

// Publish browser assets only; the Worker and hosting metadata are private.
const output = 'dist/netlify';
fs.mkdirSync(output, { recursive: true });
for (const entry of fs.readdirSync('dist', { withFileTypes: true })) {
  if (entry.isFile() && /\.(js|css|svg)$/.test(entry.name)) {
    fs.copyFileSync(path.join('dist', entry.name), path.join(output, entry.name));
  }
}
for (const entry of fs.readdirSync('public', { withFileTypes: true })) {
  if (entry.isFile() && /\.(svg|png|jpe?g|webp|gif)$/i.test(entry.name)) {
    fs.copyFileSync(path.join('public', entry.name), path.join(output, entry.name));
  }
}
const response = await worker.fetch(new Request('https://basket.example/'), {});
if (!response.ok) throw new Error(`Could not render homepage: ${response.status}`);
fs.writeFileSync(path.join(output, 'index.html'), await response.text());
console.log(`Built Netlify browser assets in ${output}.`);
