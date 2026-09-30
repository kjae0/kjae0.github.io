const filters = [...document.querySelectorAll('[data-filter]')];
const publications = [...document.querySelectorAll('.publication')];
const filterStatus = document.querySelector('#filter-status');

function filterPublications(year) {
  let count = 0;
  for (const paper of publications) {
    paper.hidden = year !== 'all' && paper.dataset.year !== year;
    if (!paper.hidden) count++;
  }
  for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === year));
  filterStatus.textContent = `Showing ${count} publication${count === 1 ? '' : 's'}${year === 'all' ? ' from all years' : ` from ${year}`}.`;
}

document.querySelector('.publication-filters').hidden = filters.length <= 2;
for (const button of filters) button.addEventListener('click', () => filterPublications(button.dataset.filter));

// News links also work when their publication is hidden by a year filter.
function revealLinkedPaper() {
  const paper = publications.find((item) => `#${item.id}` === window.location.hash);
  if (!paper?.hidden) return;
  filterPublications('all');
  requestAnimationFrame(() => paper.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', revealLinkedPaper);
document.querySelectorAll('.news-list a').forEach((link) => link.addEventListener('click', () => {
  const paper = publications.find((item) => `#${item.id}` === link.hash);
  if (paper?.hidden) filterPublications('all');
}));
revealLinkedPaper();

// Native controls remain available even when autoplay is disabled.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const videos = [...document.querySelectorAll('.publication-video')];
function updateVideoPlayback() {
  for (const video of videos) {
    video.autoplay = !reducedMotion.matches;
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => {});
  }
}
updateVideoPlayback();
reducedMotion.addEventListener('change', updateVideoPlayback);

const dialog = document.querySelector('#citation-dialog');
const citationContent = document.querySelector('#citation-content');
const copyStatus = document.querySelector('#copy-status');
const copyButton = document.querySelector('#copy-citation');

for (const button of document.querySelectorAll('[data-citation]')) {
  button.hidden = false;
  button.addEventListener('click', () => {
    const id = button.dataset.citation;
    citationContent.textContent = document.querySelector(`#citation-${id}`).content.textContent.trim();
    document.querySelector('#citation-paper-title').textContent = document.querySelector(`#title-${id}`).textContent;
    copyStatus.textContent = '';
    copyButton.textContent = 'Copy BibTeX ↗';
    dialog.showModal();
  });
}
document.querySelector('#close-citation').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(citationContent.textContent);
    copyButton.textContent = 'Copied ✓';
    copyStatus.textContent = 'Citation copied to clipboard.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(citationContent);
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = 'Text selected. Press ⌘C or Ctrl+C to copy.';
  }
});
