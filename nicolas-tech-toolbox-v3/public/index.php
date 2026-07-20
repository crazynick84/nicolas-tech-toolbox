<?php

declare(strict_types=1);

$tools = [
    'utm' => ['UTM Builder', 'Construire et analyser des URL de campagne.', '🔗'],
    'json' => ['JSON Studio', 'Valider, formater et minifier du JSON.', '🧩'],
    'csv-sql' => ['CSV → SQL', 'Transformer un fichier CSV en requêtes INSERT.', '🗃️'],
    'responses' => ['Réponses techniques', 'Préparer une réponse client ou un commentaire JIRA.', '✍️'],
    'datalayer' => ['dataLayer Viewer', 'Inspecter les événements et paramètres GTM/GA4.', '📊'],
    'dns' => ['DNS Checker', 'Contrôler A, CNAME, MX, SPF, DKIM et DMARC.', '🌐'],
];

$activeTool = $_GET['tool'] ?? '';
if (!array_key_exists($activeTool, $tools)) {
    $activeTool = '';
}
?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Boîte à outils technique de Nicolas">
    <title>Nicolas Tech Toolbox</title>
    <link rel="stylesheet" href="assets/css/app.css">
    <link rel="stylesheet" href="assets/css/datalayer.css">
    <link rel="stylesheet" href="assets/css/dns.css">
</head>
<body data-active-tool="<?= htmlspecialchars($activeTool, ENT_QUOTES, 'UTF-8') ?>">
<header class="topbar">
    <a class="brand" href="./" aria-label="Accueil Nicolas Tech Toolbox">
        <span class="brand-mark">NT</span>
        <span><strong>Nicolas</strong><small>Tech Toolbox</small></span>
    </a>
    <span class="status"><i></i> Outils opérationnels</span>
</header>

<main class="container">
    <section class="hero">
        <p class="eyebrow">SUPPORT • DATA • TRACKING</p>
        <h1>Les outils techniques utiles,<br><span>réunis au même endroit.</span></h1>
        <p>Une boîte à outils rapide et privée pour analyser, convertir et préparer tes interventions.</p>
    </section>

    <section class="tool-grid" aria-label="Outils disponibles">
        <?php foreach ($tools as $slug => [$name, $description, $icon]): ?>
            <button class="tool-card" type="button" data-open-tool="<?= $slug ?>">
                <span class="tool-icon"><?= $icon ?></span>
                <span><strong><?= htmlspecialchars($name) ?></strong><small><?= htmlspecialchars($description) ?></small></span>
                <span class="arrow">→</span>
            </button>
        <?php endforeach; ?>
    </section>

    <section class="workspace" id="utm" hidden>
        <div class="workspace-head"><div><span class="tag">URL</span><h2>UTM Builder</h2></div><button class="close" data-close>×</button></div>
        <div class="form-grid">
            <label class="wide">URL de destination<input id="utm-url" type="url" placeholder="https://exemple.org/don"></label>
            <label>Source<input id="utm-source" placeholder="newsletter"></label>
            <label>Medium<input id="utm-medium" placeholder="email"></label>
            <label>Campaign<input id="utm-campaign" placeholder="appel_ete_2026"></label>
            <label>Content<input id="utm-content" placeholder="bouton_principal"></label>
        </div>
        <button class="primary" id="build-utm">Générer l’URL</button>
        <div class="result"><code id="utm-result">L’URL générée apparaîtra ici.</code><button data-copy="utm-result">Copier</button></div>
    </section>

    <section class="workspace" id="json" hidden>
        <div class="workspace-head"><div><span class="tag">DATA</span><h2>JSON Studio</h2></div><button class="close" data-close>×</button></div>
        <label>JSON à analyser<textarea id="json-input" rows="12" placeholder='{"status":"validated","amount":50}'></textarea></label>
        <div class="actions"><button class="primary" id="format-json">Formater</button><button id="minify-json">Minifier</button><button data-copy="json-input">Copier</button></div>
        <p class="feedback" id="json-feedback" aria-live="polite"></p>
    </section>

    <section class="workspace" id="csv-sql" hidden>
        <div class="workspace-head"><div><span class="tag">SQL</span><h2>CSV → SQL</h2></div><button class="close" data-close>×</button></div>
        <div class="form-grid">
            <label>Nom de la table<input id="sql-table" value="donations"></label>
            <label>Séparateur<select id="csv-separator"><option value=",">Virgule</option><option value=";">Point-virgule</option><option value="\t">Tabulation</option></select></label>
            <label class="wide">Contenu CSV<textarea id="csv-input" rows="8" placeholder="email,amount,status&#10;donor@example.org,5000,validated"></textarea></label>
        </div>
        <button class="primary" id="convert-csv">Convertir</button>
        <div class="result result-large"><pre id="sql-result">La requête SQL apparaîtra ici.</pre><button data-copy="sql-result">Copier</button></div>
    </section>

    <section class="workspace" id="responses" hidden>
        <div class="workspace-head"><div><span class="tag">SUPPORT</span><h2>Réponses techniques</h2></div><button class="close" data-close>×</button></div>
        <div class="form-grid">
            <label>Format<select id="response-format"><option value="client">Réponse client</option><option value="jira">Commentaire JIRA interne</option></select></label>
            <label>État<select id="response-status"><option>Analyse en cours</option><option>Correction appliquée</option><option>Informations nécessaires</option><option>Escalade L2</option></select></label>
            <label class="wide">Sujet<input id="response-subject" placeholder="Ex. remontée GA4 sur la confirmation"></label>
            <label class="wide">Constat<textarea id="response-finding" rows="4" placeholder="Décris les vérifications et le résultat..."></textarea></label>
        </div>
        <button class="primary" id="generate-response">Générer le modèle</button>
        <div class="result result-large"><pre id="response-result">Le modèle apparaîtra ici.</pre><button data-copy="response-result">Copier</button></div>
    </section>

    <section class="workspace" id="datalayer" hidden>
        <div class="workspace-head"><div><span class="tag">GTM / GA4</span><h2>dataLayer Viewer</h2></div><button class="close" data-close>×</button></div>
        <p class="workspace-intro">Colle un tableau dataLayer, un objet JSON ou le résultat de <code>JSON.stringify(window.dataLayer)</code>. Tout est analysé localement dans ton navigateur.</p>
        <label>Contenu du dataLayer<textarea id="datalayer-input" rows="12" placeholder='[{"event":"gtm.js"},{"event":"purchase","transaction_id":"TX-123","value":50,"currency":"EUR"}]'></textarea></label>
        <div class="actions">
            <button class="primary" id="analyze-datalayer">Analyser</button>
            <button id="sample-datalayer">Charger un exemple</button>
            <button data-copy="datalayer-input">Copier</button>
        </div>
        <p class="feedback" id="datalayer-feedback" aria-live="polite"></p>
        <div class="datalayer-summary" id="datalayer-summary" hidden></div>
        <div class="event-toolbar" id="event-toolbar" hidden>
            <label>Filtrer les événements<input id="event-filter" type="search" placeholder="purchase, donation, gtm..."></label>
        </div>
        <div class="event-list" id="event-list"></div>
    </section>

    <section class="workspace" id="dns" hidden>
        <div class="workspace-head"><div><span class="tag">DNS / EMAIL</span><h2>DNS Checker</h2></div><button class="close" data-close>×</button></div>
        <p class="workspace-intro">Analyse les enregistrements publics d’un domaine. Pour DKIM, indique le sélecteur utilisé par le fournisseur d’envoi.</p>
        <div class="form-grid">
            <label class="wide">Nom de domaine<input id="dns-domain" inputmode="url" autocomplete="off" placeholder="example.org"></label>
            <label>Analyse rapide<select id="dns-preset"><option value="all">Tous les enregistrements</option><option value="email">Configuration email</option><option value="dmarc">DMARC uniquement</option><option value="dkim">DKIM uniquement</option></select></label>
            <label>Sélecteur DKIM<input id="dns-selector" autocomplete="off" placeholder="mandrill, default, selector1..."></label>
        </div>
        <button class="primary" id="check-dns">Analyser le DNS</button>
        <p class="feedback" id="dns-feedback" aria-live="polite"></p>
        <div class="dns-summary" id="dns-summary" hidden></div>
        <div class="dns-results" id="dns-results"></div>
    </section>

    <section class="roadmap">
        <p class="eyebrow">PROCHAINEMENT</p>
        <div><span>Webhook tester</span><span>SQL Library</span><span>Incident monitoring</span></div>
    </section>
</main>

<footer>Conçu pour le support technique • <span id="year"></span> Nicolas Tech Toolbox</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="assets/js/app.js" defer></script>
</body>
</html>
