<?php
// Заглушка Telegram Bot API и Apps Script для интеграционного теста: пишет запросы в файл, отвечает по режиму из файла.
$dir = getenv('STUB_DIR');
$mode = is_file("$dir/mode") ? trim(file_get_contents("$dir/mode")) : 'ok';
$entry = ['uri' => $_SERVER['REQUEST_URI'], 'post' => $_POST, 'body' => file_get_contents('php://input'), 'files' => array_keys($_FILES)];
file_put_contents("$dir/requests.jsonl", json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
header('Content-Type: application/json');
if ($mode === 'fail' || ($mode === 'sheets-fail' && str_contains($_SERVER['REQUEST_URI'], '/gas'))) {
    http_response_code(500);
    echo '{"ok":false}';
    exit;
}
echo '{"ok":true,"result":{}}';
