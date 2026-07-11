# Чеклист деплоя BUKSY (Cloudflare Pages)

После пуша этого кода сделать всё ниже.

---

## 1. SUPABASE — SQL Editor

Зайти в https://supabase.com → твой проект → SQL Editor → New Query

**Скопировать и выполнить** весь файл `supabase_schema.sql`.

Что создастся:
- Таблица `orders`
- Таблица `inventory`
- Функции: `decrease_stock`, `decrease_stock_bulk`, `mark_order_paid_with_stock`, `get_stock`
- Индексы и RLS

После выполнения проверить что нет ошибок.

---

## 2. CLOUDFLARE PAGES — Environment Variables

Зайти в https://dash.cloudflare.com → Pages → твой проект → Settings → Environment variables

Добавить все эти переменные (Production + Preview):

```
SUPABASE_URL               = https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = eyJhbGciOi... (service_role ключ из Supabase → Settings → API)
MONOBANK_TOKEN             = твой_токен_монобанка
TELEGRAM_BOT_TOKEN         = 123456:ABC-DEF1234...
TELEGRAM_CHAT_ID           = -1001234567890
ADMIN_LOGIN                = buksy
ADMIN_PASSWORD             = твой-пароль-админки
GITHUB_PAT                 = ghp_xxxxxxxxxxxx (GitHub Personal Access Token с правами repo)
API_SECRET                 = сгенерируй-32-символа-рандомных
VITE_API_SECRET            = то же самое что API_SECRET (одинаковые!)
CONTACT_EMAIL              = buksy.shop@gmail.com
EMAIL_WEBHOOK_URL          = (опционально) URL Google Apps Script для отправки email
RESEND_API_KEY             = (опционально) ключ Resend API как fallback
```

**Где взять:**

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → Project URL + service_role key
- `MONOBANK_TOKEN` — https://web.monobank.ua → API → создать токен
- `TELEGRAM_BOT_TOKEN` — @BotFather в Telegram → /newbot
- `TELEGRAM_CHAT_ID` — написать боту любое сообщение, потом открыть https://api.telegram.org/botТОКЕН/getUpdates → найти `chat.id`
- `GITHUB_PAT` — GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → создать с доступом к репозиторию (Contents: Read and write)
- `ADMIN_PASSWORD` — придумай сложный пароль для админки
- `API_SECRET` — сгенерировать: https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html

---

## 3. CLOUDFLARE PAGES — Build Settings

Build & deploy → Framework preset: **Vite**
Build command: `npm run build`
Build output directory: `dist`

---

## 4. ПРОВЕРИТЬ

После деплоя протестировать:

### Админка
- Открыть `https://твой-сайт.pages.dev/admin`
- Залогиниться (логин: buksy, пароль: ADMIN_PASSWORD)
- Открыть товары → проверить что все поля редактируются
- Создать новый товар → проверить уникальность slug
- Загрузить изображение → проверить что URL обновился

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
  curl -X POST https://твой-сайт.pages.dev/api/order -H "Content-Type: application/json" -d '{}'
  → 403 Forbidden
  ```
- Проверить что /api/contact работает с фронтенда
- Проверить что /api/github без авторизации → 401

---

## 5. ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

Смотреть логи:
- Cloudflare: Pages → твой проект → Functions → Logs
- Supabase: SQL Editor → `SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;`
- Telegram: `/getUpdates` у бота

---

## АРХИТЕКТУРА

- **Фронтенд**: React + TypeScript (Vite) → статические файлы в `dist/`
- **Бэкенд**: Cloudflare Pages Functions (`functions/` → `/api/*`)
- **БД**: Supabase (PostgreSQL)
- **Оплата**: Monobank API (с ECDSA верификацией колбеков)
- **Админка**: Vanilla JS в `public/admin/` → редактирует контент через GitHub API
- **Уведомления**: Telegram + Email (Gmail webhook / Resend fallback)
