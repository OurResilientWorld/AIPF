'use strict';
const contributionFields = {'correction':'location','new-evidence':'finding','improvement':'gap','accessibility':'location'};
function publicPage(value) {
  if (!value || value.length > 600) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'aipf.ourresilient.world' &&
      !u.username && !u.password && !u.port && !u.search ? u.href : null;
  } catch (_) { return null; }
}
function issueURL(repository, kind, page) {
  if (!Object.hasOwn(contributionFields, kind)) throw new Error('Unknown contribution type');
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(repository || '')) return null;
  const query = new URLSearchParams({template: kind + '.yml'});
  const safePage = publicPage(page);
  if (safePage) query.set(contributionFields[kind], safePage);
  return 'https://github.com/' + repository + '/issues/new?' + query.toString();
}
if (typeof module !== 'undefined') module.exports = {issueURL,publicPage,contributionFields};
if (typeof document !== 'undefined') {
  const config = JSON.parse(document.getElementById('feedback-config').textContent);
  const page = publicPage(new URLSearchParams(window.location.search).get('page'));
  if (page) {
    const context = document.getElementById('feedback-context');
    context.textContent = 'Regarding: ' + page;
    context.hidden = false;
    document.querySelectorAll('[data-feedback-route]').forEach(link => {
      const target = new URL(link.getAttribute('href'), window.location.href);
      target.searchParams.set('page', page);
      link.href = target.href;
    });
    const action = document.querySelector('[data-feedback-issue]');
    if (action) action.href = issueURL(config.repository, config.kind, page);
  }
}
