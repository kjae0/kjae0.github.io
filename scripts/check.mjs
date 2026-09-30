import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './build.mjs';

const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const site = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
assert(!/\{\{[A-Z_]+\}\}/.test(html), 'Unresolved template variable');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Expected one main heading');
assert.equal((html.match(/class="publication"/g) || []).length, site.publications.length, 'Missing publications');
const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const ids = new Set(allIds);
assert.equal(ids.size, allIds.length, 'Duplicate HTML IDs');
const localFiles = new Set();
for (const [, attribute, value] of html.matchAll(/\b(href|src|poster)="([^"]*)"/g)) {
  assert(value, `Empty ${attribute}`);
  if (value.startsWith('#')) assert(ids.has(value.slice(1)), `Broken anchor: ${value}`);
  else if (!/^[a-z]+:/i.test(value)) {
    assert(!value.startsWith('/'), `Root-relative path breaks project GitHub Pages: ${value}`);
    localFiles.add(value);
  }
}
for (const file of localFiles) assert((await stat(resolve(root, 'dist', file))).isFile(), `Missing file: ${file}`);
const css = await readFile(resolve(root, 'dist/assets/styles.css'), 'utf8');
for (const [, file] of css.matchAll(/url\("([^"]+)"\)/g)) assert((await stat(resolve(root, 'dist/assets', file))).isFile(), `Missing CSS asset: ${file}`);
const jsonld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
assert.equal(JSON.parse(jsonld).name, site.name, 'Invalid structured metadata');
for (const [key, url] of Object.entries(site.social)) {
  if (!url) assert(html.includes(`aria-label="${{ scholar: 'Scholar', github: 'GitHub', linkedin: 'LinkedIn' }[key]} — link coming soon"`), `Missing placeholder for ${key}`);
}
console.log(`Checks passed: ${site.publications.length} publications, ${ids.size} unique IDs, valid anchors, local assets, placeholders, and metadata.`);
