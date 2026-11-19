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

const proposalFields = {
  question: 'What needs improving, and why?',
  gap: 'Guide, case study or page',
  design: 'Your suggestion, if you have one',
  outcomes: 'What would be better for you?',
  adverse: 'Anything else we should consider?'
};
function proposalDraft(values) {
  return '# Improvement proposal — unsubmitted draft\n\n' +
    Object.entries(proposalFields).map(([key, label]) => '## ' + label + '\n\n' + (values[key] || '') + '\n').join('\n') +
    '\nReview all answers and complete the public submission acknowledgement on GitHub. This draft has not been submitted.\n';
}
function proposalURL(repository, values) {
  const base = issueURL(repository, 'improvement');
  if (!base) return null;
  const url = new URL(base);
  for (const key of Object.keys(proposalFields)) url.searchParams.set(key, values[key] || '');
  // Conservative handoff limit, not a claim about GitHub's maximum URL size.
  return url.href.length <= 6000 ? url.href : null;
}
if (typeof module !== 'undefined') Object.assign(module.exports, {proposalFields, proposalDraft, proposalURL});
if (typeof document !== 'undefined' && document.getElementById('improvement-form')) {
  const form = document.getElementById('improvement-form');
  const config = JSON.parse(document.getElementById('feedback-config').textContent);
  const status = document.getElementById('proposal-status');
  const review = document.getElementById('proposal-review');
  const values = () => Object.fromEntries(Object.keys(proposalFields).map(key => [key, form.elements.namedItem(key).value]));
  const page = publicPage(new URLSearchParams(window.location.search).get('page'));
  if (page) form.elements.namedItem('gap').value = page;
  document.getElementById('proposal-fields').disabled = false;
  document.getElementById('prepare-proposal').disabled = false;
  document.getElementById('download-proposal').disabled = false;
  form.addEventListener('input', () => {
    review.hidden = true;
    review.removeAttribute('href');
    status.textContent = 'Draft changed. Prepare the GitHub review again when ready.';
    for (const key of Object.keys(proposalFields)) form.elements.namedItem(key).setCustomValidity('');
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const key of Object.keys(proposalFields)) {
      const control = form.elements.namedItem(key);
      control.setCustomValidity(!control.required || control.value.trim() ? '' : 'Please tell us what needs improving and why.');
    }
    if (!form.reportValidity()) return;
    const url = proposalURL(config.repository, values());
    review.hidden = !url;
    if (url) {
      review.href = url;
      status.textContent = 'Ready for review. Use the link below, check your answers on GitHub and submit there. Nothing has been submitted yet.';
    } else {
      review.removeAttribute('href');
      status.textContent = 'This proposal is too long for a reliable review link. Download the complete draft, open the GitHub form directly and paste each answer into its matching field. Nothing has been submitted.';
    }
  });
  document.getElementById('download-proposal').addEventListener('click', () => {
    const blob = new Blob([proposalDraft(values())], {type:'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'aipf-improvement-proposal.md';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Draft download requested. Check your downloads before closing this tab. Nothing has been submitted.';
  });
}
