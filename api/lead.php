<?php
/**
 * POST /api/lead.php — приём заявок «Вимір» (ARCHITECTURE.md 7, фаза 6).
 * Квиз и формы шлют JSON (или multipart с файлами «Нестандартне завдання»); без JS — обычный POST, ответ 303 на /dyakuyemo.
 * Каналы: Telegram (рабочая группа), Google Sheets (Apps Script), email. Достаточно одного успешного канала;
 * если упали все — заявка пишется в резервный файл вне публичной папки, клиент получает 502 и кнопки прямой связи.
 * Секреты — только в config/lead.php вне публичной папки (в репозитории — config/lead.example.php).
 */
declare(strict_types=1);

require __DIR__ . '/lead-lib.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json')
    || str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json');

function respond(int $code, array $body, bool $json): never
{
    if (!$json) {
        // Форма без JS: успех → /dyakuyemo, ошибка → /kontakty (там все способы связи)
        header('Location: ' . ($body['ok'] ?? false ? '/dyakuyemo' : '/kontakty'), true, 303);
        exit;
    }
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'method'], true);
}

$configPath = lead_config_path(__DIR__);
if ($configPath === null) respond(500, ['ok' => false, 'error' => 'config'], $wantsJson);
$cfg = lead_config((array) require $configPath, $configPath);
$dataDir = (string) $cfg['data_dir'];

if (!lead_origin_allowed($_SERVER['HTTP_ORIGIN'] ?? null, $cfg)) respond(403, ['ok' => false, 'error' => 'origin'], $wantsJson);

// Тело: JSON до 10 КБ, или поле payload (multipart с файлами), или обычные поля формы
if (str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    $raw = file_get_contents('php://input', false, null, 0, LEAD_MAX_JSON_BYTES + 1) ?: '';
    if (strlen($raw) > LEAD_MAX_JSON_BYTES) respond(413, ['ok' => false, 'error' => 'size'], true);
    $in = json_decode($raw, true);
} elseif (isset($_POST['payload'])) {
    $in = json_decode((string) $_POST['payload'], true);
} else {
    $in = $_POST;
}
if (!is_array($in)) respond(400, ['ok' => false, 'error' => 'body'], $wantsJson);

// Бот: делаем вид, что всё хорошо, и никуда не отправляем
if (lead_is_bot($in)) respond(200, ['ok' => true, 'leadId' => 'ok'], $wantsJson);

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
if (!lead_rate_allow($dataDir, $ip, (int) $cfg['rate_limit'], (int) $cfg['rate_window_sec'], time())) {
    lead_log($dataDir, 'warn', 'rate limit');
    respond(429, ['ok' => false, 'error' => 'rate'], $wantsJson);
}

[$lead, $errors] = lead_validate($in);
if ($errors) respond(422, ['ok' => false, 'error' => 'invalid', 'fields' => $errors], $wantsJson);

if (lead_seen_before($dataDir, $lead['eventId'])) respond(200, ['ok' => true, 'leadId' => $lead['eventId']], $wantsJson);

$files = [];
if ($lead['form'] === 'zapyt' && isset($_FILES['files'])) {
    $files = array_slice(array_values(array_filter(lead_files_list($_FILES['files']), 'lead_file_ok')), 0, LEAD_FILES_MAX);
}

// --- Каналы: Telegram и Sheets параллельно (curl_multi), затем email ---
$timeout = (int) $cfg['channel_timeout_sec'];
$handles = [];
$mh = curl_multi_init();
$tgOn = $cfg['telegram_bot_token'] !== '' && $cfg['telegram_chat_id'] !== '';
$tgBase = rtrim((string) $cfg['telegram_api'], '/') . '/bot' . $cfg['telegram_bot_token'];
if ($tgOn) {
    $fields = ['chat_id' => $cfg['telegram_chat_id'], 'text' => lead_telegram_text($lead, $files), 'parse_mode' => 'HTML', 'disable_web_page_preview' => 'true'];
    if ($cfg['telegram_thread_id'] !== '') $fields['message_thread_id'] = $cfg['telegram_thread_id'];
    $h = curl_init($tgBase . '/sendMessage');
    curl_setopt_array($h, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $fields, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout]);
    $handles['telegram'] = $h;
}
if ($cfg['gas_url'] !== '') {
    $body = json_encode(['secret' => $cfg['gas_secret'], 'row' => lead_sheet_row($lead, new DateTimeImmutable())], JSON_UNESCAPED_UNICODE);
    $h = curl_init((string) $cfg['gas_url']);
    curl_setopt_array($h, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3, CURLOPT_TIMEOUT => $timeout,
    ]);
    $handles['sheets'] = $h;
}
foreach ($handles as $h) curl_multi_add_handle($mh, $h);
do {
    $status = curl_multi_exec($mh, $running);
    if ($running) curl_multi_select($mh, 1.0);
} while ($running && $status === CURLM_OK);

$ok = [];
$failed = [];
foreach ($handles as $channel => $h) {
    $resp = json_decode((string) curl_multi_getcontent($h), true);
    $success = is_array($resp) && ($resp['ok'] ?? false) === true;
    if ($success) $ok[] = $channel;
    else $failed[] = $channel;
    if (!$success) lead_log($dataDir, 'error', "$channel failed: http " . curl_getinfo($h, CURLINFO_HTTP_CODE) . ' ' . curl_error($h) . ' id=' . $lead['eventId']);
    curl_multi_remove_handle($mh, $h);
    curl_close($h);
}
curl_multi_close($mh);

// Файлы «Нестандартне завдання» — вслед за сообщением, в ту же группу
if ($tgOn && in_array('telegram', $ok, true)) {
    foreach ($files as $f) {
        $h = curl_init($tgBase . '/sendDocument');
        $doc = ['chat_id' => $cfg['telegram_chat_id'], 'document' => new CURLFile($f['tmp_name'], '', basename((string) $f['name'])), 'caption' => 'ID ' . $lead['eventId']];
        if ($cfg['telegram_thread_id'] !== '') $doc['message_thread_id'] = $cfg['telegram_thread_id'];
        curl_setopt_array($h, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $doc, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
        $r = json_decode((string) curl_exec($h), true);
        if (!is_array($r) || ($r['ok'] ?? false) !== true) lead_log($dataDir, 'error', 'telegram file failed id=' . $lead['eventId']);
        curl_close($h);
    }
}
// Таблица упала, Telegram жив — короткая пометка в группу
if ($tgOn && in_array('telegram', $ok, true) && in_array('sheets', $failed, true)) {
    $h = curl_init($tgBase . '/sendMessage');
    curl_setopt_array($h, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => ['chat_id' => $cfg['telegram_chat_id'], 'text' => 'Рядок у таблицю не записано, ID ' . $lead['eventId']], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout]);
    curl_exec($h);
    curl_close($h);
}

if ($cfg['lead_email_to'] !== '') {
    $text = html_entity_decode(strip_tags(lead_telegram_text($lead, $files)), ENT_QUOTES, 'UTF-8');
    $headers = ['Content-Type: text/plain; charset=utf-8'];
    if ($cfg['lead_email_from'] !== '') $headers[] = 'From: ' . str_replace(["\r", "\n"], '', (string) $cfg['lead_email_from']);
    $subject = '=?UTF-8?B?' . base64_encode(lead_email_subject($lead, $failed)) . '?=';
    if (@mail((string) $cfg['lead_email_to'], $subject, $text, implode("\r\n", $headers))) $ok[] = 'email';
    else {
        $failed[] = 'email';
        lead_log($dataDir, 'error', 'email failed id=' . $lead['eventId']);
    }
}

if (!$ok) {
    // Все каналы упали — заявка не теряется: резервный файл вне публичной папки
    @file_put_contents($dataDir . '/leads-failed.jsonl', json_encode(['at' => gmdate('c'), 'lead' => $lead], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
    lead_log($dataDir, 'error', 'all channels failed id=' . $lead['eventId']);
    respond(502, ['ok' => false, 'error' => 'channels'], $wantsJson);
}

lead_log($dataDir, 'info', 'lead ' . $lead['eventId'] . ' form=' . $lead['form'] . ' ok=' . implode(',', $ok) . ($failed ? ' failed=' . implode(',', $failed) : ''));
respond(200, ['ok' => true, 'leadId' => $lead['eventId']], $wantsJson);
