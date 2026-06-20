# Чеклист деплоя BUKSY

После пуша этого кода сделать всё ниже.

---

## 1. SUPABASE — SQL Editor

Зайти в https://supabase.com → твой проект → SQL Editor → New Query

**Скопировать и выполнить** весь файл `supabase_schema.sql`.

Что создастся:
- Таблица `orders` (добавится колонка `idempotency_key`, `stock_decreased`)
- Таблица `inventory`
- Функции: `decrease_stock`, `mark_order_paid_with_stock`, `get_stock`
- Индексы и RLS

После выполнения проверить что нет ошибок.

---

## 2. NETLIFY — Environment Variables

Зайти в https://app.netlify.com → твой сайт → Site settings → Environment variables

Добавить все эти переменные (Key / Value):

```
SUPABASE_URL               = https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = eyJhbGciOi... (service_role ключ из Supabase → Settings → API)
MONOBANK_TOKEN             = твой_токен_монобанка
TELEGRAM_BOT_TOKEN         = 123456:ABC-DEF1234...
TELEGRAM_CHAT_ID           = -1001234567890
EMAIL_SMTP_USER            = buksy.shop@gmail.com
EMAIL_SMTP_PASS            = gmail_app_password (16 символов, без пробелов)
API_SECRET                 = сгенерируй-32-символа-рандомных
VITE_API_SECRET            = то же самое что API_SECRET (одинаковые!)
```

**Где взять:**

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → Project URL + service_role key
- `MONOBANK_TOKEN` — https://web.monobank.ua → API → создать токен
- `TELEGRAM_BOT_TOKEN` — @BotFather в Telegram → /newbot
- `TELEGRAM_CHAT_ID` — написать боту любое сообщение, потом открыть https://api.telegram.org/botТОКЕН/getUpdates → найти `chat.id`
- `EMAIL_SMTP_PASS` — Gmail → Настройки → Безопасность → Двухфакторная аутентификация → Пароли приложений → создать пароль для приложения "Почта"
- `API_SECRET` + `VITE_API_SECRET` — сгенерировать: https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html

---

## 3. NETLIFY — Rate Limiting

Зайти в https://app.netlify.com → твой сайт → Site settings → Rate Limiting

Нажать **Enable Rate Limiting**. Настройки по умолчанию (100 requests/minute на IP) — ок.

---

## 4. NETLIFY — Identity (для админки)

Зайти в Site settings → Identity → Enable Identity

Registration → **Invite only** (не Open!)

Перейти во вкладку Identity → Invite users → отправить приглашение на свою почту. После подтверждения будешь заходить в `/admin`.

---

## 5. NETLIFY — Build hooks (для авто-деплоя после CMS)

Если CMS (Decap) будет менять контент, нужен build hook чтобы Netlify пересобрал сайт:

Site settings → Build & deploy → Build hooks → Add build hook

Название: `CMS update`
Ветка: `main`

Скопировать URL. Потом вставить в `public/admin/config.yml` (если ещё не настроено).

---

## 6. ПРОВЕРИТЬ

После деплоя протестировать:

### Админка
- Открыть `https://твой-сайт.netlify.app/admin`
- Залогиниться через Netlify Identity
- Открыть товары → проверить что все поля редактируются

### Платёжка
- Добавить товар в корзину
- Пройти до чекаута
- Нажать "Оплатить картой" → должно редиректить на Monobank
- Оплатить тестовую сумму (или отменить)
- Проверить Telegram — должно прийти уведомление о заказе

### Колбек
- После оплаты — должен прийти callback от Monobank
- Проверить в Supabase: статус заказа → `paid`, `paid_at` заполнен, `stock_decreased = true`
- Должен прийти Telegram "ОПЛАЧЕНО" и email покупателю

### Безопасность
- Проверить curl-ом без ключа:
  ```
  curl -X POST https://твой-сайт/.netlify/functions/order -H "Content-Type: application/json" -d '{}'
  → 403 Forbidden
  ```

---

## 7. ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

Смотреть логи:
- Netlify: Site settings → Functions → выбираешь функцию → смотришь логи
- Supabase: SQL Editor → `SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;`
- Telegram: `/getUpdates` у бота
