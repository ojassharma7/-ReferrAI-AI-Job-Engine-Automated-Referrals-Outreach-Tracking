/* ReferrAI capture popup. */

const DEFAULT_API = 'http://localhost:3210';
const $ = (id) => document.getElementById(id);

// Runs IN the job page (injected). Heuristics across common job boards + a
// generic fallback. Must be self-contained (no closure refs).
function extractJob() {
  const txt = (sels) => {
    for (const s of sels) {
      const el = document.querySelector(s);
      const t = el && el.textContent ? el.textContent.trim() : '';
      if (t) return t;
    }
    return '';
  };
  const meta = (n) =>
    document.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.content || '';

  const title =
    txt([
      '.job-details-jobs-unified-top-card__job-title',
      '.topcard__title',
      'h1.jobsearch-JobInfoHeader-title',
      '[data-testid="jobTitle"]',
      '.posting-headline h2',
      'h1',
    ]) ||
    meta('og:title') ||
    document.title;

  const company =
    txt([
      '.job-details-jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-InlineCompanyRating div',
      '.posting-categories .sort-by-time',
      '[class*="company-name"]',
    ]) || meta('og:site_name');

  let description = txt([
    '#job-details',
    '.jobs-description__content',
    '.description__text',
    '#jobDescriptionText',
    '[data-testid="jobDescriptionText"]',
    '.posting-page .section-wrapper',
    'article',
    'main',
  ]);
  if (!description) description = document.body.innerText || '';

  return {
    title: title.replace(/\s+/g, ' ').trim().slice(0, 200),
    company: company.replace(/\s+/g, ' ').trim().slice(0, 120),
    description: description.replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000),
  };
}

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get('apiBase');
  return (apiBase || DEFAULT_API).replace(/\/+$/, '');
}

async function captureActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJob,
    });
    if (result) {
      $('company').value = result.company || '';
      $('role').value = result.title || '';
      $('jd').value = result.description || '';
    }
  } catch {
    $('results').innerHTML =
      '<p class="muted">Couldn\'t read this page. Fill the fields manually.</p>';
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

function renderContact(c) {
  const name = escapeHtml(c.full_name || 'Unknown');
  const title = escapeHtml(c.title || '');
  const links = [];
  if (c.email) links.push(`<a href="mailto:${escapeHtml(c.email)}">Email</a>`);
  if (c.linkedin_url) links.push(`<a href="${escapeHtml(c.linkedin_url)}" target="_blank">LinkedIn</a>`);
  return `<div class="contact"><div class="name">${name}</div><div class="meta">${title}</div><div>${links.join('')}</div></div>`;
}

async function findContacts() {
  const company = $('company').value.trim();
  const role = $('role').value.trim();
  if (!company || !role) {
    $('results').innerHTML = '<p class="muted">Enter a company and role first.</p>';
    return;
  }
  const btn = $('find');
  btn.disabled = true;
  btn.textContent = 'Searching…';
  $('results').innerHTML = '';

  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, role }),
    });
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    const recruiters = data.recruiters || [];
    const employees = data.domainEmployees || [];

    let html = '';
    if (recruiters.length) {
      html += '<div class="section-title">Recruiters</div>' + recruiters.map(renderContact).join('');
    }
    if (employees.length) {
      html += `<div class="section-title">People in ${escapeHtml(role)} roles</div>` + employees.map(renderContact).join('');
    }
    if (!html) html = '<p class="muted">No contacts found. Try a broader role.</p>';
    $('results').innerHTML = html;
  } catch (err) {
    $('results').innerHTML = `<p class="muted">${escapeHtml(err.message || 'Search failed')}. Check the ReferrAI URL in Settings and its host permission.</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Find contacts';
  }
}

async function openInReferrAI() {
  const apiBase = await getApiBase();
  const company = encodeURIComponent($('company').value.trim());
  const role = encodeURIComponent($('role').value.trim());
  chrome.tabs.create({ url: `${apiBase}/dashboard?company=${company}&role=${role}` });
}

document.addEventListener('DOMContentLoaded', async () => {
  $('apiBase').value = await getApiBase();
  $('apiBase').addEventListener('change', (e) => {
    chrome.storage.local.set({ apiBase: e.target.value.trim() });
  });
  $('find').addEventListener('click', findContacts);
  $('open').addEventListener('click', openInReferrAI);
  await captureActiveTab();
});
