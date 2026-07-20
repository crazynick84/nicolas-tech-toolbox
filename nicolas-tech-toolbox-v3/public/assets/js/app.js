'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function showTool(slug) {
  $$('.workspace').forEach((workspace) => { workspace.hidden = workspace.id !== slug; });
  const target = document.getElementById(slug);
  if (target) {
    history.replaceState(null, '', `?tool=${encodeURIComponent(slug)}`);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 1800);
}

$$('[data-open-tool]').forEach((button) => button.addEventListener('click', () => showTool(button.dataset.openTool)));
$$('[data-close]').forEach((button) => button.addEventListener('click', () => {
  button.closest('.workspace').hidden = true;
  history.replaceState(null, '', location.pathname);
}));

$$('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  const source = document.getElementById(button.dataset.copy);
  const value = 'value' in source ? source.value : source.textContent;
  await navigator.clipboard.writeText(value);
  toast('Copié dans le presse-papiers');
}));

$('#build-utm').addEventListener('click', () => {
  try {
    const url = new URL($('#utm-url').value);
    const fields = { source: 'utm_source', medium: 'utm_medium', campaign: 'utm_campaign', content: 'utm_content' };
    Object.entries(fields).forEach(([id, parameter]) => {
      const value = $(`#utm-${id}`).value.trim();
      if (value) url.searchParams.set(parameter, value);
    });
    $('#utm-result').textContent = url.toString();
  } catch {
    $('#utm-result').textContent = 'Erreur : saisis une URL complète commençant par https://';
  }
});

function transformJson(compact) {
  const feedback = $('#json-feedback');
  try {
    const data = JSON.parse($('#json-input').value);
    $('#json-input').value = JSON.stringify(data, null, compact ? 0 : 2);
    feedback.textContent = 'JSON valide ✓';
    feedback.className = 'feedback';
  } catch (error) {
    feedback.textContent = `JSON invalide : ${error.message}`;
    feedback.className = 'feedback error';
  }
}

$('#format-json').addEventListener('click', () => transformJson(false));
$('#minify-json').addEventListener('click', () => transformJson(true));

function parseCsvLine(line, separator) {
  const values = []; let current = ''; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === separator && !quoted) { values.push(current); current = ''; }
    else current += char;
  }
  values.push(current);
  return values;
}

const sqlIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;
const sqlValue = (value) => value === '' ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`;

$('#convert-csv').addEventListener('click', () => {
  const lines = $('#csv-input').value.trim().split(/\r?\n/).filter(Boolean);
  const separator = $('#csv-separator').value === '\\t' ? '\t' : $('#csv-separator').value;
  if (lines.length < 2) { $('#sql-result').textContent = 'Ajoute une ligne d’en-têtes et au moins une ligne de données.'; return; }
  const headers = parseCsvLine(lines.shift(), separator);
  const rows = lines.map((line) => `(${parseCsvLine(line, separator).map(sqlValue).join(', ')})`);
  const table = sqlIdentifier($('#sql-table').value.trim() || 'my_table');
  $('#sql-result').textContent = `INSERT INTO ${table} (${headers.map(sqlIdentifier).join(', ')})\nVALUES\n${rows.join(',\n')};`;
});

$('#generate-response').addEventListener('click', () => {
  const format = $('#response-format').value;
  const status = $('#response-status').value;
  const subject = $('#response-subject').value.trim() || '[sujet]';
  const finding = $('#response-finding').value.trim() || '[constat et vérifications réalisées]';
  const client = `Bonjour,\n\nNous avons bien pris en compte votre demande concernant ${subject}.\n\n${finding}\n\nStatut : ${status}.\n\nNous reviendrons vers vous dès que nous disposerons de nouveaux éléments.\n\nBien cordialement,\nNicolas`;
  const jira = `Contexte\n${subject}\n\nVérifications / constat\n${finding}\n\nStatut\n${status}\n\nProchaine action\n[à compléter]`;
  $('#response-result').textContent = format === 'client' ? client : jira;
});

const dataLayerSample = [
  { event: 'gtm.js', 'gtm.start': 1784563200000 },
  { event: 'begin_checkout', ecommerce: { currency: 'EUR', value: 50, items: [{ item_name: 'Don ponctuel', price: 50, quantity: 1 }] } },
  { event: 'purchase', transaction_id: 'DON-2026-001', value: 50, currency: 'EUR', payment_type: 'creditcard' },
  { event: 'donation_validated', donation_id: 'DON-2026-001', donation_amount: 50, donation_currency: 'EUR', donation_frequency: 'once' }
];

let parsedDataLayer = [];

function normalizeDataLayer(value) {
  const parsed = JSON.parse(value);
  if (Array.isArray(parsed)) {
    const entries = parsed.filter((item) => item && typeof item === 'object');
    if (!entries.length) throw new Error('Le tableau ne contient aucun objet exploitable.');
    return entries;
  }
  if (parsed && typeof parsed === 'object') return [parsed];
  throw new Error('Le contenu doit être un objet ou un tableau JSON.');
}

function trackingWarnings(item) {
  const warnings = [];
  if (!item.event) warnings.push('event manquant');
  if (item.event === 'purchase') {
    const source = item.ecommerce?.purchase || item.ecommerce || item;
    if (!source.transaction_id && !source.transactionId && !source.actionField?.id) warnings.push('transaction_id manquant');
    if (source.value === undefined && source.revenue === undefined && !source.actionField?.revenue) warnings.push('value manquante');
    if (!source.currency && !item.currency) warnings.push('currency manquante');
  }
  return warnings;
}

function renderDataLayer(filter = '') {
  const query = filter.trim().toLowerCase();
  const eventList = $('#event-list');
  const filtered = parsedDataLayer.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  eventList.replaceChildren();

  filtered.forEach((item, index) => {
    const details = document.createElement('details');
    details.className = 'event-card';
    const summary = document.createElement('summary');
    const warnings = trackingWarnings(item);
    const keys = Object.keys(item);

    const indexSpan = document.createElement('span');
    indexSpan.className = 'event-index';
    indexSpan.textContent = `#${parsedDataLayer.indexOf(item) + 1}`;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'event-name';
    nameSpan.textContent = item.event || '(objet sans événement)';
    const countSpan = document.createElement('span');
    countSpan.className = 'event-count';
    countSpan.textContent = `${keys.length} champ${keys.length > 1 ? 's' : ''}`;
    summary.append(indexSpan, nameSpan, countSpan);

    if (warnings.length) {
      const warningSpan = document.createElement('span');
      warningSpan.className = 'event-warning';
      warningSpan.textContent = `⚠ ${warnings.join(', ')}`;
      summary.append(warningSpan);
    }

    const pre = document.createElement('pre');
    pre.className = 'event-json';
    pre.textContent = JSON.stringify(item, null, 2);
    details.append(summary, pre);
    if (filtered.length === 1 || index === 0) details.open = true;
    eventList.append(details);
  });

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'feedback error';
    empty.textContent = 'Aucun événement ne correspond au filtre.';
    eventList.append(empty);
  }
}

function analyzeDataLayer() {
  const feedback = $('#datalayer-feedback');
  try {
    parsedDataLayer = normalizeDataLayer($('#datalayer-input').value);
    const events = parsedDataLayer.filter((item) => item && typeof item === 'object' && item.event);
    const purchases = events.filter((item) => item.event === 'purchase');
    const warnings = parsedDataLayer.reduce((total, item) => total + trackingWarnings(item).length, 0);
    $('#datalayer-summary').innerHTML = `
      <div class="summary-card"><strong>${parsedDataLayer.length}</strong><small>Entrées analysées</small></div>
      <div class="summary-card"><strong>${new Set(events.map((item) => item.event)).size}</strong><small>Événements distincts</small></div>
      <div class="summary-card"><strong>${warnings}</strong><small>Alertes de structure</small></div>`;
    $('#datalayer-summary').hidden = false;
    $('#event-toolbar').hidden = false;
    feedback.textContent = `${events.length} événement(s) détecté(s), dont ${purchases.length} purchase.`;
    feedback.className = 'feedback';
    renderDataLayer($('#event-filter').value);
  } catch (error) {
    parsedDataLayer = [];
    $('#datalayer-summary').hidden = true;
    $('#event-toolbar').hidden = true;
    $('#event-list').replaceChildren();
    feedback.textContent = `dataLayer invalide : ${error.message}`;
    feedback.className = 'feedback error';
  }
}

$('#analyze-datalayer').addEventListener('click', analyzeDataLayer);
$('#sample-datalayer').addEventListener('click', () => {
  $('#datalayer-input').value = JSON.stringify(dataLayerSample, null, 2);
  analyzeDataLayer();
});
$('#event-filter').addEventListener('input', (event) => renderDataLayer(event.target.value));

function formatDnsRecord(record) {
  if (record.type === 'A') return record.ip || '';
  if (record.type === 'AAAA') return record.ipv6 || '';
  if (record.type === 'CNAME' || record.type === 'NS') return record.target || '';
  if (record.type === 'MX') return `${record.pri ?? 0} ${record.target || ''}`;
  if (record.type === 'TXT') return record.txt || (record.entries || []).join('');
  if (record.type === 'SOA') {
    return `mname=${record.mname || ''}\nrname=${record.rname || ''}\nserial=${record.serial ?? ''}\nrefresh=${record.refresh ?? ''}\nretry=${record.retry ?? ''}\nexpire=${record.expire ?? ''}`;
  }
  return JSON.stringify(record, null, 2);
}

function renderDnsResults(payload) {
  const container = $('#dns-results');
  container.replaceChildren();
  const found = payload.results.filter((result) => result.found).length;
  const missing = payload.results.length - found;

  $('#dns-summary').innerHTML = `
    <div class="summary-card"><strong>${payload.results.length}</strong><small>Types contrôlés</small></div>
    <div class="summary-card"><strong>${found}</strong><small>Enregistrements trouvés</small></div>
    <div class="summary-card"><strong>${missing}</strong><small>Absents ou non publiés</small></div>`;
  $('#dns-summary').hidden = false;

  payload.results.forEach((result) => {
    const article = document.createElement('article');
    article.className = 'dns-card';
    const head = document.createElement('div');
    head.className = 'dns-card-head';
    const type = document.createElement('span');
    type.className = 'dns-type';
    type.textContent = result.label;
    const host = document.createElement('span');
    host.className = 'dns-host';
    host.textContent = result.host;
    const state = document.createElement('span');
    state.className = `dns-state ${result.found ? 'ok' : 'missing'}`;
    state.textContent = result.found ? 'Trouvé' : 'Absent';
    head.append(type, host, state);
    article.append(head);

    const records = document.createElement('pre');
    records.className = 'dns-records';
    records.textContent = result.found
      ? result.records.map(formatDnsRecord).filter(Boolean).join('\n\n')
      : 'Aucun enregistrement correspondant.';
    article.append(records);
    container.append(article);
  });
}

$('#check-dns').addEventListener('click', async () => {
  const feedback = $('#dns-feedback');
  const button = $('#check-dns');
  const domain = $('#dns-domain').value.trim();
  const params = new URLSearchParams({ domain, preset: $('#dns-preset').value });
  const selector = $('#dns-selector').value.trim();
  if (selector) params.set('selector', selector);

  button.disabled = true;
  feedback.textContent = 'Résolution DNS en cours…';
  feedback.className = 'feedback';
  $('#dns-summary').hidden = true;
  $('#dns-results').replaceChildren();

  try {
    const response = await fetch(`api/dns.php?${params.toString()}`, { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `Erreur HTTP ${response.status}`);
    renderDnsResults(payload);
    feedback.textContent = `Analyse terminée pour ${payload.domain}.`;
  } catch (error) {
    feedback.textContent = `Analyse impossible : ${error.message}`;
    feedback.className = 'feedback error';
  } finally {
    button.disabled = false;
  }
});

$('#year').textContent = new Date().getFullYear();
if (document.body.dataset.activeTool) showTool(document.body.dataset.activeTool);
