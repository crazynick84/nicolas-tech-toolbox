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

$('#year').textContent = new Date().getFullYear();
if (document.body.dataset.activeTool) showTool(document.body.dataset.activeTool);
