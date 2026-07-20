<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function normalizeDnsName(string $value): string
{
    $value = strtolower(rtrim(trim($value), '.'));

    if ($value === '' || strlen($value) > 253) {
        respond(['error' => 'Le nom DNS est vide ou trop long.'], 422);
    }

    if (!preg_match('/^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i', $value)) {
        respond(['error' => 'Le nom DNS fourni est invalide.'], 422);
    }

    return $value;
}

function queryDns(string $host, int $type): array
{
    $records = @dns_get_record($host, $type);
    return is_array($records) ? $records : [];
}

$domain = normalizeDnsName((string) ($_GET['domain'] ?? ''));
$preset = (string) ($_GET['preset'] ?? 'all');
$selector = trim((string) ($_GET['selector'] ?? ''));

if ($selector !== '' && !preg_match('/^[a-z0-9_-]{1,63}$/i', $selector)) {
    respond(['error' => 'Le sélecteur DKIM est invalide.'], 422);
}

$validPresets = ['all', 'email', 'dmarc', 'dkim'];
if (!in_array($preset, $validPresets, true)) {
    respond(['error' => 'Le type d’analyse demandé est invalide.'], 422);
}

$queries = [];

if ($preset === 'all') {
    $queries = [
        'A' => [$domain, DNS_A],
        'AAAA' => [$domain, DNS_AAAA],
        'CNAME' => [$domain, DNS_CNAME],
        'MX' => [$domain, DNS_MX],
        'TXT' => [$domain, DNS_TXT],
        'NS' => [$domain, DNS_NS],
        'SOA' => [$domain, DNS_SOA],
        'DMARC' => ['_dmarc.' . $domain, DNS_TXT],
    ];
} elseif ($preset === 'email') {
    $queries = [
        'MX' => [$domain, DNS_MX],
        'SPF' => [$domain, DNS_TXT],
        'DMARC' => ['_dmarc.' . $domain, DNS_TXT],
    ];
} elseif ($preset === 'dmarc') {
    $queries = ['DMARC' => ['_dmarc.' . $domain, DNS_TXT]];
}

if (($preset === 'all' || $preset === 'email' || $preset === 'dkim') && $selector !== '') {
    $queries['DKIM'] = [$selector . '._domainkey.' . $domain, DNS_TXT];
}

if ($preset === 'dkim' && $selector === '') {
    respond(['error' => 'Indique un sélecteur pour analyser DKIM.'], 422);
}

$results = [];
foreach ($queries as $label => [$host, $type]) {
    $records = queryDns($host, $type);
    if ($label === 'SPF') {
        $records = array_values(array_filter($records, static function (array $record): bool {
            $text = (string) ($record['txt'] ?? '');
            return str_starts_with(strtolower($text), 'v=spf1');
        }));
    }
    if ($label === 'DMARC') {
        $records = array_values(array_filter($records, static function (array $record): bool {
            $text = (string) ($record['txt'] ?? '');
            return str_starts_with(strtolower($text), 'v=dmarc1');
        }));
    }
    if ($label === 'DKIM') {
        $records = array_values(array_filter($records, static function (array $record): bool {
            $text = strtolower((string) ($record['txt'] ?? ''));
            return str_contains($text, 'v=dkim1') || str_contains($text, 'p=');
        }));
    }

    $results[] = [
        'label' => $label,
        'host' => $host,
        'found' => count($records) > 0,
        'records' => $records,
    ];
}

respond([
    'domain' => $domain,
    'checked_at' => gmdate(DATE_ATOM),
    'results' => $results,
]);
