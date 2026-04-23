import { fetchDocs, renderDocsWidget } from './widget.js';

const observer = new MutationObserver(async () => {
  const page = document.querySelector('.inf-page');
  if (!page) return;

  if (page.dataset.docsInjected === 'true') return;

  const isAssistanceRoute =
    location.hash === '' ||
    location.hash === '#assistance' ||
    location.hash === '#home';

  if (!isAssistanceRoute) return;

  page.dataset.docsInjected = 'true';

  const docs = await fetchDocs();
  const widgetHtml = renderDocsWidget(docs);
  page.insertAdjacentHTML('beforeend', widgetHtml);
});

const root = document.getElementById('app');
if (root) {
  observer.observe(root, { childList: true, subtree: true });
}
