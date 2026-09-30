import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const e = escapeHtml;
const external = 'target="_blank" rel="noopener noreferrer"';

function icon(name) {
  const paths = {
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    scholar: '<path d="m2 9 10-6 10 6-10 6L2 9Z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 9v7"/>',
    github: '<path d="M9 19c-4.3 1.3-4.3-2.2-6-2.6m12 5v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.4 6a4.3 4.3 0 0 0-.1-3.5S17.3 2.2 15 3.8a12.1 12.1 0 0 0-6 0C6.7 2.2 5.7 2.5 5.7 2.5A4.3 4.3 0 0 0 5.6 6a4.7 4.7 0 0 0-1.3 3.7c0 4.7 2.8 5.7 5.5 6A3 3 0 0 0 9 18v3.4"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7m5 0v-7m0 3a2.5 2.5 0 0 1 5 0v4M7 7h.01"/>',
  };
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function citation(p) {
  const kind = { preprint: 'misc', conference: 'inproceedings', journal: 'article' }[p.type];
  const fields = { title: p.citationTitle || p.title, author: p.authors.join(' and '), year: p.year };
  if (p.type === 'conference') fields.booktitle = p.booktitle;
  if (p.type === 'journal') fields.journal = p.venue;
  if (p.arxiv) Object.assign(fields, { eprint: p.arxiv, archivePrefix: 'arXiv' });
  if (p.doi) fields.doi = p.doi;
  fields.url = p.links.find((link) => link.label === 'arXiv')?.url || p.links[0].url;
  return `@${kind}{${p.id.replaceAll('-', '')}${p.year},\n${Object.entries(fields).map(([key, value]) => `  ${key} = {${value}}`).join(',\n')}\n}`;
}

function publication(p, name) {
  const authors = p.authors.map((author) => [name, 'Jae Yeong Kim'].includes(author) ? `<strong>${e(author)}</strong>` : e(author)).join(', ');
  const dimensions = `width="${e(p.imageWidth || 440)}" height="${e(p.imageHeight || 300)}"`;
  const visual = p.video
    ? `<video class="publication-video" ${dimensions} muted loop playsinline controls preload="metadata"${p.image ? ` poster="${e(p.image)}"` : ''} aria-label="${e(p.shortTitle)} research video"><source src="${e(p.video)}" type="video/mp4"><a href="${e(p.video)}">Download the ${e(p.shortTitle)} video</a></video>`
    : p.image
    ? `<img src="${e(p.image)}" alt="${e(p.title)} — research figure" ${dimensions} loading="lazy">`
    : `<img class="placeholder-art" src="assets/images/research-placeholder.svg" alt="" width="440" height="300" loading="lazy"><span class="figure-name">${e(p.shortTitle)}</span><span class="figure-placeholder">Image placeholder</span>`;
  return `<article class="publication" id="${e(p.id)}" data-year="${p.year}" aria-labelledby="title-${e(p.id)}">
    <div class="publication-teaser">
      <div class="publication-visual${p.image || p.video ? ' has-media' : ''}"${p.image || p.video ? '' : ' role="img" aria-label="Research figure placeholder"'}>${visual}</div>
    </div>
    <div class="publication-content">
      <h3 id="title-${e(p.id)}"><a href="${e(p.links[0].url)}" ${external}>${e(p.title)}</a></h3>
      <p class="authors">${authors}</p>
      <p class="venue">${e(p.venue)}, ${p.year}${p.venueNote ? ` · ${e(p.venueNote)}` : ''}</p>
      <div class="paper-links">${p.links.map((link) => `<a href="${e(link.url)}" ${external} aria-label="${e(link.label)} for ${e(p.shortTitle)}">${e(link.label)}</a>`).join('')}<button class="citation-button" data-citation="${e(p.id)}" aria-label="Show BibTeX citation for ${e(p.shortTitle)}" hidden>BibTeX</button></div>
      <template id="citation-${e(p.id)}">${e(citation(p))}</template>
    </div>
  </article>`;
}

export async function build() {
  const site = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
  const ids = new Set();
  for (const p of site.publications) {
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw new Error(`Invalid or duplicate publication ID: ${p.id}`);
    ids.add(p.id);
    if (!Number.isInteger(p.year) || !p.authors?.length || !p.links?.length) throw new Error(`Incomplete publication: ${p.id}`);
    for (const link of p.links) if (!/^https:\/\//.test(link.url)) throw new Error(`Expected HTTPS publication link: ${p.id}`);
  }
  for (const item of site.news) if (!ids.has(item.publication)) throw new Error(`Unknown news publication: ${item.publication}`);
  for (const url of Object.values(site.social)) if (url && !/^https:\/\//.test(url)) throw new Error('Social links must be empty or HTTPS URLs.');
  const publications = [...site.publications].sort((a, b) => b.year - a.year);
  const newsItem = (item) => `<li><time datetime="${e(item.date)}">${e(item.label)}</time><a href="#${e(item.publication)}">${e(item.text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</a></li>`;
  const social = Object.entries({ scholar: 'Scholar', github: 'GitHub', linkedin: 'LinkedIn' }).map(([key, label]) => site.social[key]
    ? `<a class="social-link" href="${e(site.social[key])}" ${external}>${icon(key)}${label}</a>`
    : `<span class="social-placeholder" role="link" aria-disabled="true" tabindex="0" aria-label="${label} — link coming soon">${icon(key)}${label}<span class="social-tooltip" aria-hidden="true">Link coming soon</span></span>`).join('');
  const years = [...new Set(publications.map((p) => p.year))];
  const structuredData = { '@context': 'https://schema.org', '@type': 'Person', name: site.name, description: site.description, knowsAbout: site.interests, affiliation: { '@type': 'CollegeOrUniversity', name: 'KAIST' }, alumniOf: { '@type': 'CollegeOrUniversity', name: 'Seoul National University' }, sameAs: Object.values(site.social).filter(Boolean) };
  if (site.siteUrl) structuredData.url = site.siteUrl;
  const replacements = {
    TITLE: e(site.title), DESCRIPTION: e(site.description), NAME: e(site.name), INITIALS: e(site.initials),
    AFFILIATION: e(site.affiliation), AFFILIATION_URL: e(site.affiliationUrl),
    ADVISOR: e(site.advisor), ADVISOR_URL: e(site.advisorUrl), LAB: e(site.lab), LAB_URL: e(site.labUrl),
    BIO: e(site.bio), PORTRAIT: e(site.portrait), PORTRAIT_ALT: e(site.portraitAlt),
    PORTRAIT_WIDTH: e(site.portraitWidth || 460), PORTRAIT_HEIGHT: e(site.portraitHeight || 560),
    CONTACT_TEXT: e(site.contactText),
    EMAIL_LINK: site.email ? `<a class="social-link email-link" href="mailto:${e(encodeURIComponent(site.email).replace('%40', '@'))}" title="${e(site.email)}">${icon('email')}<span>Email</span></a>` : '',
    PORTRAIT_LABEL: site.portraitIsPlaceholder ? '<span class="portrait-label">Photo placeholder</span>' : '',
    SOCIAL_LINKS: social,
    RECENT_NEWS: site.news.slice(0, 5).map(newsItem).join(''),
    EARLIER_NEWS: site.news.length > 5 ? `<details class="earlier-news"><summary>View earlier updates <span aria-hidden="true">+</span></summary><ul class="news-list">${site.news.slice(5).map(newsItem).join('')}</ul></details>` : '',
    FILTERS: ['all', ...years].map((year) => `<button type="button" data-filter="${year}" aria-pressed="${year === 'all'}">${year === 'all' ? 'All' : year}</button>`).join(''),
    PUBLICATIONS: publications.map((p) => publication(p, site.name)).join('\n'),
    EDUCATION: site.education.map((item) => `<li class="education-item"><h3>${e(item.degree)} · ${e(item.school)}</h3><p>${e(item.detail)}</p>${item.advisor ? `<p class="advisor">Advised by <a href="${e(item.advisorUrl)}" ${external}>Prof. ${e(item.advisor)}</a></p>` : ''}</li>`).join(''),
    YEAR: e(site.updated.slice(0, 4)), UPDATED: new Date(`${site.updated}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    CANONICAL: site.siteUrl ? `<link rel="canonical" href="${e(site.siteUrl)}"><meta property="og:url" content="${e(site.siteUrl)}">` : '',
    STRUCTURED_DATA: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
  };
  const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
  const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in replacements)) throw new Error(`Unknown template variable: ${key}`);
    return replacements[key];
  });
  const out = resolve(root, 'dist');
  await mkdir(out, { recursive: true });
  await rm(resolve(out, 'assets'), { recursive: true, force: true });
  await cp(resolve(root, 'public/assets'), resolve(out, 'assets'), { recursive: true });
  await writeFile(resolve(out, 'index.html'), html);
  await writeFile(resolve(out, '.nojekyll'), '');
  console.log(`Built ${publications.length} publications → dist/`);
  return site;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
}
