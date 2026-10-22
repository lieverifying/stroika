<?php
/**
 * Тесты приёма заявок (api/lead-lib.php, api/lead.php). Запуск: npm run test:php
 * Юнит-тесты чистых функций + интеграция: lead.php под php -S, Telegram и Apps Script — заглушка tests/php/stub.php.
 */
declare(strict_types=1);
require __DIR__ . '/../../api/lead-lib.php';

$passed = 0;
$failed = 0;
function t(string $name, callable $fn): void
{
    global $passed, $failed;
    try {
        $fn();
        $passed++;
        echo "  ✓ $name\n";
    } catch (Throwable $e) {
        $failed++;
        echo "  ✗ $name\n    " . $e->getMessage() . "\n";
    }
}
function eq(mixed $actual, mixed $expected, string $msg = ''): void
{
    if ($actual !== $expected) throw new Exception(($msg ? "$msg: " : '') . 'ожидали ' . var_export($expected, true) . ', получили ' . var_export($actual, true));
}
function ok(bool $cond, string $msg): void
{
    if (!$cond) throw new Exception($msg);
}

$valid = [
    'form' => 'quiz', 'contactMethod' => 'viber', 'name' => 'Олена', 'phone' => '+380 67 123 45 67', 'consent' => true,
    'eventId' => 'abc12345-test', 'landing' => 'kukhni', 'page' => '/kukhni', 'elapsedMs' => 20000, 'website' => '',
    'quiz' => ['summary' => 'Кухня · Кутова · 3–4 м', 'branch' => 'kitchen', 'result' => ['variant' => 'B']],
    'attribution' => ['utm_source' => 'instagram', 'utm_medium' => 'cpc', 'utm_campaign' => 'kukhni-oct'],
];

echo "Юнит\n";
t('телефон: разные записи → +380XXXXXXXXX', function () {
    foreach (['0671234567', '+380671234567', '+38 (067) 123-45-67', '380671234567', '671234567'] as $p) eq(lead_normalize_phone($p), '+380671234567', $p);
    eq(lead_normalize_phone('06712'), null);
});
t('валидация: верная заявка без ошибок', function () use ($valid) {
    [$lead, $err] = lead_validate($valid);
    eq($err, []);
    eq($lead['phone'], '+380671234567');
    eq($lead['landing'], 'kukhni');
});
t('валидация: пустые поля → ошибки по каждому', function () {
    [, $err] = lead_validate(['form' => 'x']);
    eq($err, ['form', 'contactMethod', 'name', 'phone', 'consent']);
});
t('валидация: «Нестандартне завдання» требует описание 10–1000 символов', function () use ($valid) {
    [, $err] = lead_validate(['form' => 'zapyt', 'request' => 'коротко'] + $valid);
    eq($err, ['request']);
    [, $err] = lead_validate(['form' => 'zapyt', 'request' => 'Шафа в нішу 2,4 м'] + $valid);
    eq($err, []);
});
t('валидация: чужой landing → none, плохой eventId заменяется', function () use ($valid) {
    [$lead] = lead_validate(['landing' => 'evil', 'eventId' => '<script>'] + $valid);
    eq($lead['landing'], 'none');
    ok((bool) preg_match('/^[a-f0-9]{16}$/', $lead['eventId']), 'новый id');
});
t('бот: ловушка или быстрее 3 с', function () use ($valid) {
    eq(lead_is_bot($valid), false);
    eq(lead_is_bot(['website' => 'http://spam'] + $valid), true);
    eq(lead_is_bot(['elapsedMs' => 900] + $valid), true);
});
t('Telegram: первая строка — способ связи, HTML экранирован', function () use ($valid) {
    [$lead] = lead_validate(['name' => '<b>Ол</b>', 'contactMethod' => 'call'] + $valid);
    $text = lead_telegram_text($lead);
    $lines = explode("\n", $text);
    eq($lines[0], '<b>Дзвінок</b>');
    eq($lines[1], 'Нова заявка: Квіз · Кухня');
    ok(str_contains($text, '&lt;b&gt;Ол&lt;/b&gt;'), 'имя экранировано');
    ok(str_contains($text, 'Телефон: +380671234567'), 'телефон');
    ok(str_contains($text, 'Джерело: instagram / cpc / kukhni-oct'), 'источник');
    ok(str_contains($text, 'Сторінка: /kukhni (kukhni)'), 'страница');
});
t('/planuvannya: «Планування» и «Замір з лендингу» — тип первой строкой, способ связи второй; поля формы в сообщении', function () use ($valid) {
    [$plan, $err] = lead_validate(['form' => 'plan', 'wallWidths' => '3,2 і 2,4', 'landing' => 'planuvannya', 'quiz' => null] + $valid);
    eq($err, []);
    $lines = explode("\n", lead_telegram_text($plan, [['name' => 'plan.jpg']]));
    eq($lines[0], '<b>Планування</b>');
    eq($lines[1], "Зв'язок: Viber");
    ok(in_array('Ширина стін, м: 3,2 і 2,4', $lines, true), 'ширина стін');
    ok(in_array('Файли: 1 (нижче)', $lines, true), 'файлы');
    ok(str_contains(end($lines) . prev($lines), 'planuvannya') || str_contains(implode("\n", $lines), '(planuvannya)'), 'посадочная');
    [$zamir, $err] = lead_validate(['form' => 'zamir', 'time' => 'evening', 'contactMethod' => 'call', 'quiz' => null] + $valid);
    eq($err, []);
    $lines = explode("\n", lead_telegram_text($zamir));
    eq($lines[0], '<b>Замір з лендингу</b>');
    eq($lines[1], "Зв'язок: Дзвінок");
    ok(in_array('Зручний час: Увечері', $lines, true), 'время');
    [$bad] = lead_validate(['form' => 'zamir', 'time' => '<x>', 'quiz' => null] + $valid);
    eq($bad['time'], '', 'чужое значение времени отбрасывается');
});
t('/planuvannya-mebli: «Планування меблів» с размерами ниши и «що потрібно»; «Замір з лендингу меблів»', function () use ($valid) {
    [$plan, $err] = lead_validate(['form' => 'plan_mebli', 'item' => 'harderobna', 'nicheWidth' => '2,4', 'nicheHeight' => '2,7', 'nicheDepth' => '', 'landing' => 'planuvannya-mebli', 'quiz' => null] + $valid);
    eq($err, []);
    eq($plan['landing'], 'planuvannya-mebli');
    $lines = explode("\n", lead_telegram_text($plan));
    eq($lines[0], '<b>Планування меблів</b>');
    eq($lines[1], "Зв'язок: Viber");
    ok(in_array('Що потрібно: Гардеробна', $lines, true), 'що потрібно');
    ok(in_array('Розміри, м: ширина 2,4 · висота 2,7', $lines, true), 'размеры без пустой глубины');
    [$z, $err] = lead_validate(['form' => 'zamir_mebli', 'time' => 'morning', 'contactMethod' => 'call', 'quiz' => null] + $valid);
    eq($err, []);
    $zl = explode("\n", lead_telegram_text($z));
    eq($zl[0], '<b>Замір з лендингу меблів</b>');
    ok(in_array('Зручний час: Зранку', $zl, true), 'время');
    [$bad] = lead_validate(['form' => 'plan_mebli', 'item' => '<b>', 'quiz' => null] + $valid);
    eq($bad['item'], '', 'чужое значение «що потрібно» отбрасывается');
});
t('Sheets: 22 колонки A–V, формулы обезврежены', function () use ($valid) {
    [$lead] = lead_validate(['name' => '=HYPERLINK("x")'] + $valid);
    $row = lead_sheet_row($lead, new DateTimeImmutable('2026-10-21T10:00:00Z'));
    eq(count($row), 22);
    eq($row[0], '2026-10-21 13:00:00');
    eq($row[3], "'=HYPERLINK(\"x\")");
    eq($row[5], 'Viber');
});
t('тема письма: без переводов строк, пометки упавших каналов', function () use ($valid) {
    [$lead] = lead_validate($valid);
    $s = lead_email_subject($lead, ['telegram']);
    ok(!str_contains($s, "\n"), 'без \n');
    ok(str_starts_with($s, '[TELEGRAM FAIL] Заявка: Квіз · Олена'), $s);
});
t('Origin: свой разрешён, чужой — нет, без заголовка — разрешён', function () {
    $cfg = ['site_url' => 'https://vymir.ua', 'allowed_origins' => ['http://127.0.0.1:8099']];
    eq(lead_origin_allowed('https://vymir.ua', $cfg), true);
    eq(lead_origin_allowed('http://127.0.0.1:8099', $cfg), true);
    eq(lead_origin_allowed('https://evil.example', $cfg), false);
    eq(lead_origin_allowed(null, $cfg), true);
});
t('частота: 5 заявок за окно, шестая — нет; другой IP — да', function () {
    $dir = sys_get_temp_dir() . '/vymir-rate-' . bin2hex(random_bytes(4));
    for ($i = 0; $i < 5; $i++) eq(lead_rate_allow($dir, '1.1.1.1', 5, 600, 1000 + $i), true);
    eq(lead_rate_allow($dir, '1.1.1.1', 5, 600, 1010), false);
    eq(lead_rate_allow($dir, '2.2.2.2', 5, 600, 1010), true);
    eq(lead_rate_allow($dir, '1.1.1.1', 5, 600, 1700), true, 'окно прошло');
    ok(!str_contains((string) file_get_contents("$dir/rate.json"), '1.1.1.1'), 'IP хранится хешем');
});
t('повтор eventId отсекается', function () {
    $dir = sys_get_temp_dir() . '/vymir-ids-' . bin2hex(random_bytes(4));
    eq(lead_seen_before($dir, 'id-1-aaaa'), false);
    eq(lead_seen_before($dir, 'id-1-aaaa'), true);
    eq(lead_seen_before($dir, 'id-2-bbbb'), false);
});

echo "Интеграция (php -S)\n";
$tmp = sys_get_temp_dir() . '/vymir-it-' . bin2hex(random_bytes(4));
mkdir("$tmp/stub", 0700, true);
$stubPort = 18000 + random_int(0, 900);
$apiPort = $stubPort + 1000;
file_put_contents("$tmp/lead.php", '<?php return ' . var_export([
    'site_url' => 'https://vymir.ua',
    'telegram_bot_token' => 'TEST',
    'telegram_chat_id' => '-100',
    'telegram_api' => "http://127.0.0.1:$stubPort",
    'gas_url' => "http://127.0.0.1:$stubPort/gas",
    'gas_secret' => 's3cret',
    'data_dir' => "$tmp/data",
    'rate_limit' => 50,
], true) . ';');
$php = PHP_BINARY;
$stub = proc_open([$php, '-S', "127.0.0.1:$stubPort", __DIR__ . '/stub.php'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $p1, null, ['STUB_DIR' => "$tmp/stub"]);
$api = proc_open([$php, '-S', "127.0.0.1:$apiPort", '-t', dirname(__DIR__, 2) . '/api'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $p2, null, ['VYMIR_LEAD_CONFIG' => "$tmp/lead.php"]);
usleep(600000);

function post(int $port, array|string $body, array $headers = ['Content-Type: application/json', 'Accept: application/json'], bool $multipart = false): array
{
    $h = curl_init("http://127.0.0.1:$port/lead.php");
    curl_setopt_array($h, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $multipart ? $body : (is_string($body) ? $body : json_encode($body)), CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => false]);
    $resp = (string) curl_exec($h);
    $code = curl_getinfo($h, CURLINFO_HTTP_CODE);
    $loc = curl_getinfo($h, CURLINFO_REDIRECT_URL);
    curl_close($h);
    return [$code, json_decode($resp, true), $loc];
}
$requests = function () use ($tmp): array {
    $f = "$tmp/stub/requests.jsonl";
    $list = is_file($f) ? array_map(fn($l) => json_decode($l, true), file($f, FILE_IGNORE_NEW_LINES)) : [];
    @unlink($f);
    return $list;
};

try {
    t('заявка квиза → 200, Telegram и таблица получили её', function () use ($valid, $apiPort, $requests) {
        [$code, $body] = post($apiPort, $valid);
        eq($code, 200);
        eq($body, ['ok' => true, 'leadId' => 'abc12345-test']);
        $reqs = $requests();
        eq(count($reqs), 2);
        $tg = array_values(array_filter($reqs, fn($r) => str_contains($r['uri'], '/botTEST/sendMessage')))[0];
        eq($tg['post']['chat_id'], '-100');
        ok(str_starts_with($tg['post']['text'], '<b>Viber</b>'), 'первая строка — способ связи');
        $gas = array_values(array_filter($reqs, fn($r) => $r['uri'] === '/gas'))[0];
        $g = json_decode($gas['body'], true);
        eq($g['secret'], 's3cret');
        eq($g['row'][4], "'+380671234567", 'телефон текстом, не числом');
    });
    t('тот же eventId повторно → 200, но второй раз не отправляется', function () use ($valid, $apiPort, $requests) {
        [$code] = post($apiPort, $valid);
        eq($code, 200);
        eq($requests(), []);
    });
    t('ловушка заполнена → 200 и тишина', function () use ($valid, $apiPort, $requests) {
        [$code, $body] = post($apiPort, ['website' => 'spam', 'eventId' => 'bot-12345678'] + $valid);
        eq($code, 200);
        eq($body['ok'], true);
        eq($requests(), []);
    });
    t('неверные поля → 422 со списком полей', function () use ($apiPort) {
        [$code, $body] = post($apiPort, ['form' => 'quiz', 'elapsedMs' => 9000]);
        eq($code, 422);
        eq($body['fields'], ['contactMethod', 'name', 'phone', 'consent']);
    });
    t('чужой Origin → 403', function () use ($valid, $apiPort) {
        [$code] = post($apiPort, ['eventId' => 'origin-1234'] + $valid, ['Content-Type: application/json', 'Accept: application/json', 'Origin: https://evil.example']);
        eq($code, 403);
    });
    t('GET → 405', function () use ($apiPort) {
        $h = curl_init("http://127.0.0.1:$apiPort/lead.php");
        curl_setopt($h, CURLOPT_RETURNTRANSFER, true);
        curl_exec($h);
        eq(curl_getinfo($h, CURLINFO_HTTP_CODE), 405);
    });
    t('таблица упала → 200 (Telegram жив) и пометка в группу', function () use ($valid, $apiPort, $requests, $tmp) {
        file_put_contents("$tmp/stub/mode", 'sheets-fail');
        [$code] = post($apiPort, ['eventId' => 'sheets-fail-1'] + $valid);
        eq($code, 200);
        $texts = array_map(fn($r) => $r['post']['text'] ?? '', $requests());
        ok((bool) array_filter($texts, fn($t) => str_contains($t, 'Рядок у таблицю не записано, ID sheets-fail-1')), 'пометка');
    });
    t('все каналы упали → 502 и заявка в резервном файле', function () use ($valid, $apiPort, $requests, $tmp) {
        file_put_contents("$tmp/stub/mode", 'fail');
        [$code, $body] = post($apiPort, ['eventId' => 'all-fail-1'] + $valid);
        eq($code, 502);
        eq($body['ok'], false);
        $backup = (string) file_get_contents("$tmp/data/leads-failed.jsonl");
        ok(str_contains($backup, 'all-fail-1') && str_contains($backup, '+380671234567'), 'резерв');
        $requests();
        file_put_contents("$tmp/stub/mode", 'ok');
    });
    t('«Нестандартне завдання» с файлом (multipart) → сообщение и документ', function () use ($valid, $apiPort, $requests, $tmp) {
        $png = "$tmp/plan.png";
        file_put_contents($png, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='));
        $payload = ['form' => 'zapyt', 'request' => 'Шафа в нішу 2,4 м, фото плану', 'eventId' => 'zapyt-file-1', 'quiz' => null] + $valid;
        [$code] = post($apiPort, ['payload' => json_encode($payload), 'files[0]' => new CURLFile($png, 'image/png', 'plan.png')], ['Accept: application/json'], true);
        eq($code, 200);
        $uris = array_map(fn($r) => $r['uri'], $requests());
        ok(in_array('/botTEST/sendDocument', $uris, true), 'документ отправлен: ' . implode(', ', $uris));
    });
    t('форма без JS (urlencoded) → 303 на /dyakuyemo', function () use ($apiPort, $requests) {
        $fields = http_build_query(['form' => 'zapyt', 'contactMethod' => 'telegram', 'name' => 'Ігор', 'phone' => '0671234567', 'consent' => 'on', 'request' => 'Тумба у ванну 80 см']);
        [$code, , $loc] = post($apiPort, $fields, ['Content-Type: application/x-www-form-urlencoded']);
        eq($code, 303);
        ok(str_ends_with((string) $loc, '/dyakuyemo'), (string) $loc);
        $requests();
    });
    t('журнал без имени и телефона', function () use ($tmp) {
        $log = (string) file_get_contents("$tmp/data/lead.log");
        ok(str_contains($log, 'abc12345-test'), 'id в журнале');
        ok(!str_contains($log, 'Олена') && !str_contains($log, '671234567'), 'без личных данных');
    });
} finally {
    proc_terminate($stub);
    proc_terminate($api);
}

echo "\n$passed passed, $failed failed\n";
exit($failed ? 1 : 0);
