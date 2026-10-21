<?php
/**
 * Приём заявок «Вимір» — чистые функции (ARCHITECTURE.md 7). Подключается из api/lead.php и из тестов (tests/php).
 * Без фреймворка и Composer: PHP 8.1+, расширения curl, json, mbstring, fileinfo.
 */
declare(strict_types=1);

const LEAD_FORMS = ['quiz', 'zapyt'];
const LEAD_METHODS = ['viber' => 'Viber', 'telegram' => 'Telegram', 'call' => 'Дзвінок'];
const LEAD_FORM_TITLES = ['quiz' => 'Квіз', 'zapyt' => 'Нестандартне завдання'];
const LEAD_LANDINGS = ['kukhni', 'mebli', 'none'];
const LEAD_MIN_ELAPSED_MS = 3000; // быстрее — бот
const LEAD_MAX_JSON_BYTES = 10240;
const LEAD_FILES_MAX = 3;
const LEAD_FILE_MAX_BYTES = 10 * 1024 * 1024;
const LEAD_FILE_EXT = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf'];

/**
 * Конфиг вне публичной папки. Порядок поиска: VYMIR_LEAD_CONFIG → <над корнем сайта>/config/lead.php
 * (хостинг: api/ лежит в public_html) → <корень репозитория>/config/lead.php (локальная разработка).
 */
function lead_config_path(string $apiDir): ?string
{
    $candidates = array_filter([
        getenv('VYMIR_LEAD_CONFIG') ?: null,
        dirname($apiDir, 2) . '/config/lead.php',
        dirname($apiDir) . '/config/lead.php',
    ]);
    foreach ($candidates as $path) {
        if (is_file($path)) return $path;
    }
    return null;
}

/** Значения по умолчанию; файл конфига перекрывает их */
function lead_config(array $raw, string $configPath): array
{
    return array_merge([
        'site_url' => '',
        'allowed_origins' => [],
        'telegram_bot_token' => '',
        'telegram_chat_id' => '',
        'telegram_thread_id' => '',
        'telegram_api' => 'https://api.telegram.org',
        'gas_url' => '',
        'gas_secret' => '',
        'lead_email_to' => '',
        'lead_email_from' => '',
        'rate_limit' => 5,
        'rate_window_sec' => 600,
        'data_dir' => dirname($configPath) . '/data',
        'channel_timeout_sec' => 5,
    ], $raw);
}

/** Origin запроса разрешён: совпадает с site_url или allowed_origins. Без заголовка Origin (форма без JS) — разрешён. */
function lead_origin_allowed(?string $origin, array $cfg): bool
{
    if ($origin === null || $origin === '') return true;
    $allowed = array_filter(array_merge([$cfg['site_url']], (array) $cfg['allowed_origins']));
    if (!$allowed) return true; // site_url ещё не задан (технический адрес) — не блокируем
    $norm = static fn(string $u): string => strtolower(rtrim($u, '/'));
    foreach ($allowed as $a) {
        if ($norm($origin) === $norm((string) $a)) return true;
    }
    return false;
}

/** Телефон Украины → +380XXXXXXXXX или null (та же логика, что src/lib/phone.ts) */
function lead_normalize_phone(string $raw): ?string
{
    $d = preg_replace('/\D/', '', $raw) ?? '';
    if (str_starts_with($d, '380')) $d = substr($d, 3);
    elseif (str_starts_with($d, '80') && strlen($d) >= 11) $d = substr($d, 2);
    if (str_starts_with($d, '0')) $d = substr($d, 1);
    $d = substr($d, 0, 9);
    return strlen($d) === 9 ? '+380' . $d : null;
}

/** Строка без управляющих символов, обрезанная до $max символов */
function lead_clean(mixed $v, int $max): string
{
    if (!is_string($v) && !is_int($v) && !is_float($v)) return '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', trim((string) $v)) ?? '';
    return mb_substr($s, 0, $max);
}

/** Бот: заполнено поле-ловушка или форма отправлена быстрее 3 с */
function lead_is_bot(array $in): bool
{
    if (lead_clean($in['website'] ?? '', 200) !== '') return true;
    $elapsed = $in['elapsedMs'] ?? null;
    return is_numeric($elapsed) && (int) $elapsed < LEAD_MIN_ELAPSED_MS;
}

/**
 * Серверная проверка и нормализация. Возвращает [lead, errors]: errors — список имён полей с ошибкой.
 */
function lead_validate(array $in): array
{
    $errors = [];
    $form = lead_clean($in['form'] ?? '', 20);
    if (!in_array($form, LEAD_FORMS, true)) $errors[] = 'form';
    $method = lead_clean($in['contactMethod'] ?? '', 20);
    if (!isset(LEAD_METHODS[$method])) $errors[] = 'contactMethod';
    $name = lead_clean($in['name'] ?? '', 60);
    $len = mb_strlen($name);
    if ($len < 2 || $len > 50) $errors[] = 'name';
    $phone = lead_normalize_phone(lead_clean($in['phone'] ?? '', 40));
    if ($phone === null) $errors[] = 'phone';
    $consent = $in['consent'] ?? false;
    if ($consent !== true && $consent !== 'true' && $consent !== 'on' && $consent !== '1') $errors[] = 'consent';
    $request = lead_clean($in['request'] ?? '', 1100);
    if ($form === 'zapyt') {
        $rl = mb_strlen($request);
        if ($rl < 10 || $rl > 1000) $errors[] = 'request';
    }
    $landing = lead_clean($in['landing'] ?? 'none', 20);
    $eventId = lead_clean($in['eventId'] ?? '', 64);
    if (!preg_match('/^[A-Za-z0-9-]{8,64}$/', $eventId)) $eventId = bin2hex(random_bytes(8));

    $quiz = is_array($in['quiz'] ?? null) ? $in['quiz'] : [];
    $attr = is_array($in['attribution'] ?? null) ? $in['attribution'] : [];
    $attribution = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'referrer', 'landingPage'] as $k) {
        $v = lead_clean($attr[$k] ?? '', 300);
        if ($v !== '') $attribution[$k] = $v;
    }

    $lead = [
        'eventId' => $eventId,
        'form' => $form,
        'contactMethod' => $method,
        'name' => $name,
        'phone' => $phone ?? '',
        'referrer' => lead_clean($in['referrer'] ?? '', 100),
        'request' => $form === 'zapyt' ? $request : '',
        'landing' => in_array($landing, LEAD_LANDINGS, true) ? $landing : 'none',
        'page' => lead_clean($in['page'] ?? '', 200),
        'quizSummary' => lead_clean($quiz['summary'] ?? '', 400),
        'quizBranch' => lead_clean($quiz['branch'] ?? '', 20),
        'quizTiming' => lead_clean($quiz['timing'] ?? '', 60),
        'resultVariant' => lead_clean($quiz['result']['variant'] ?? '', 2),
        'attribution' => $attribution,
    ];
    return [$lead, $errors];
}

function lead_html(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Сообщение в Telegram (parse_mode HTML). Первая строка — способ связи (CLAUDE.md): менеджер сразу видит, куда писать.
 */
function lead_telegram_text(array $lead, array $files = []): string
{
    $lines = ['<b>' . lead_html(LEAD_METHODS[$lead['contactMethod']] ?? $lead['contactMethod']) . '</b>'];
    $title = LEAD_FORM_TITLES[$lead['form']] ?? $lead['form'];
    if ($lead['form'] === 'quiz' && $lead['quizSummary'] !== '') {
        $first = explode(' · ', $lead['quizSummary'])[0];
        $title .= ' · ' . $first;
    }
    $lines[] = 'Нова заявка: ' . lead_html($title);
    $lines[] = "Ім'я: " . lead_html($lead['name']);
    $lines[] = 'Телефон: ' . lead_html($lead['phone']);
    if ($lead['quizSummary'] !== '') $lines[] = 'Відповіді: ' . lead_html($lead['quizSummary']);
    if ($lead['request'] !== '') $lines[] = 'Завдання: ' . lead_html($lead['request']);
    if ($files) $lines[] = 'Файли: ' . count($files) . ' (нижче)';
    if ($lead['referrer'] !== '') $lines[] = 'Порекомендував: ' . lead_html($lead['referrer']);
    $a = $lead['attribution'];
    $source = implode(' / ', array_filter([$a['utm_source'] ?? '', $a['utm_medium'] ?? '', $a['utm_campaign'] ?? '']));
    if ($source !== '') $lines[] = 'Джерело: ' . lead_html($source);
    $page = $lead['page'] !== '' ? $lead['page'] : '—';
    $lines[] = 'Сторінка: ' . lead_html($page) . ($lead['landing'] !== 'none' ? ' (' . lead_html($lead['landing']) . ')' : '');
    $lines[] = 'ID: <code>' . lead_html($lead['eventId']) . '</code>';
    return implode("\n", $lines);
}

/** Защита от формул в Google Sheets: значение, начинающееся с = + - @, получает префикс ' */
function lead_sheet_safe(string $s): string
{
    return preg_match('/^[=+\-@\t\r]/', $s) ? "'" . $s : $s;
}

/** Строка для таблицы (колонки A–V, ARCHITECTURE.md 7.2) */
function lead_sheet_row(array $lead, DateTimeImmutable $now): array
{
    $a = $lead['attribution'];
    $row = [
        $now->setTimezone(new DateTimeZone('Europe/Kyiv'))->format('Y-m-d H:i:s'),
        $lead['eventId'],
        LEAD_FORM_TITLES[$lead['form']] ?? $lead['form'],
        $lead['name'],
        $lead['phone'],
        LEAD_METHODS[$lead['contactMethod']] ?? '',
        '',
        $lead['quizTiming'],
        $lead['quizBranch'],
        $lead['quizSummary'],
        '',
        '',
        $lead['request'],
        $a['utm_source'] ?? '',
        $a['utm_medium'] ?? '',
        $a['utm_campaign'] ?? '',
        $a['utm_content'] ?? '',
        $a['utm_term'] ?? '',
        $lead['page'],
        trim(($a['referrer'] ?? '') . ' ' . ($a['landingPage'] ?? '')),
        trim(($a['fbclid'] ?? '') . ' ' . ($a['gclid'] ?? '')),
        $lead['resultVariant'],
    ];
    return array_map(static fn($v) => lead_sheet_safe((string) $v), $row);
}

/** Тема письма без переводов строк (защита заголовков) */
function lead_email_subject(array $lead, array $failed): string
{
    $tags = implode('', array_map(static fn($c) => '[' . strtoupper($c) . ' FAIL]', $failed));
    $s = trim($tags . ' Заявка: ' . (LEAD_FORM_TITLES[$lead['form']] ?? '') . ' · ' . $lead['name'] . ' · ' . $lead['phone']);
    return str_replace(["\r", "\n"], ' ', $s);
}

/** Файл к заявке допустим: загружен через POST, расширение и тип из списка, до 10 МБ */
function lead_file_ok(array $f): bool
{
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return false;
    if (($f['size'] ?? 0) <= 0 || $f['size'] > LEAD_FILE_MAX_BYTES) return false;
    $ext = strtolower(pathinfo((string) ($f['name'] ?? ''), PATHINFO_EXTENSION));
    if (!in_array($ext, LEAD_FILE_EXT, true)) return false;
    if (!is_file((string) ($f['tmp_name'] ?? ''))) return false;
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: '';
    $okMime = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf', 'application/octet-stream'];
    return in_array($mime, $okMime, true);
}

/** $_FILES['files'] (multiple) → список отдельных файлов */
function lead_files_list(array $files): array
{
    if (!isset($files['name']) || !is_array($files['name'])) return isset($files['name']) ? [$files] : [];
    $out = [];
    foreach ($files['name'] as $i => $name) {
        if ($name === '' || $name === null) continue;
        $out[] = [
            'name' => $name,
            'type' => $files['type'][$i] ?? '',
            'tmp_name' => $files['tmp_name'][$i] ?? '',
            'error' => $files['error'][$i] ?? UPLOAD_ERR_NO_FILE,
            'size' => $files['size'][$i] ?? 0,
        ];
    }
    return $out;
}

/** Ограничение частоты: не больше $limit заявок с одного IP за $window секунд. Файловый счётчик с блокировкой. */
function lead_rate_allow(string $dir, string $ip, int $limit, int $window, int $now): bool
{
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/rate.json';
    $fh = @fopen($file, 'c+');
    if (!$fh) return true; // хранилище недоступно — заявку не теряем
    flock($fh, LOCK_EX);
    $data = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
    $key = hash('sha256', $ip);
    $hits = array_values(array_filter($data[$key] ?? [], static fn($t) => $t > $now - $window));
    $allowed = count($hits) < $limit;
    if ($allowed) $hits[] = $now;
    $data[$key] = $hits;
    // чистим старые IP
    foreach ($data as $k => $list) {
        if (!array_filter($list, static fn($t) => $t > $now - $window)) unset($data[$k]);
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $allowed;
}

/** Повтор того же eventId (двойной клик, повтор после таймаута) — true, если уже был */
function lead_seen_before(string $dir, string $eventId): bool
{
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $fh = @fopen($dir . '/recent-ids.json', 'c+');
    if (!$fh) return false;
    flock($fh, LOCK_EX);
    $ids = json_decode(stream_get_contents($fh) ?: '[]', true) ?: [];
    $seen = in_array($eventId, $ids, true);
    if (!$seen) {
        $ids[] = $eventId;
        $ids = array_slice($ids, -500);
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($ids));
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $seen;
}

/** Строка в журнал без имени и телефона */
function lead_log(string $dir, string $level, string $msg): void
{
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/lead.log';
    if (is_file($file) && filesize($file) > 1024 * 1024) @rename($file, $file . '.1');
    @file_put_contents($file, gmdate('c') . " [$level] $msg\n", FILE_APPEND | LOCK_EX);
}
