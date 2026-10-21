<?php
// Конфиг приёма заявок (api/lead.php). Скопировать в config/lead.php и заполнить.
// На хостинге файл лежит ВНЕ public_html: <домашний каталог>/config/lead.php. В репозиторий настоящие значения не попадают.
return [
  'site_url' => '',               // https://vymir.ua — разрешённый Origin; пусто — не проверяем (технический адрес)
  'allowed_origins' => [],        // дополнительные Origin, например технический адрес хостинга
  'telegram_bot_token' => '',
  'telegram_chat_id' => '',
  'telegram_thread_id' => '',     // тема в группе-форуме, необязательно
  'gas_url' => '',                // веб-приложение Google Apps Script (integrations/google-apps-script/Code.gs)
  'gas_secret' => '',             // общий секрет, тот же, что в Code.gs
  'lead_email_to' => '',          // копия заявок на почту
  'lead_email_from' => '',        // отправитель, ящик на домене сайта
  'rate_limit' => 5,              // заявок с одного IP
  'rate_window_sec' => 600,       // за 10 минут
  // 'data_dir' => '/home/.../lead-data', // журнал, счётчики, резерв заявок; по умолчанию config/data
];
