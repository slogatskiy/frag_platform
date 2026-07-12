# Roadmap & Current State

> Единый источник правды: где мы сейчас и что дальше.
> См. также `BACKLOG.md` (детальный чеклист) и `IDEAS.md` (копилка идей).
> Последнее обновление: 2026-07-12.

## 🌍 Живой продукт
- **Сайт:** https://frag-platform.vercel.app (автодеплой с push в `main`)
- **Репо:** https://github.com/slogatskiy/frag_platform (публичный)
- **Каталог:** 59 420 ароматов · ~4 700 с фото · у всех есть цена (оценочная)

## 🧱 Стек
Next.js 16 (App Router, TS, Turbopack) · Tailwind v4 · Prisma 6 · PostgreSQL (Supabase, eu-west-1) · Vercel (регион dub1) · шрифт Fraunces (serif) + тёмная премиум-тема. UI на English.

## ✅ Сделано
- Каталог: поиск + **сортировка** (Featured/Name/Newest/Oldest/Price)
- **Карточка аромата** `/fragrance/[slug]` — фото, ноты, цена, «кто из друзей владеет/хочет»
- **Discover по нотам** `/discover` — подбор по любимым нотам + сохранение в профиль
- **Полка** `/shelf` — коллекция, стоимость, сортировка, счётчик ×N, публичная страница `/u/[handle]`
- **Вишлист** `/wishlist` + сердечки в каталоге
- **Друзья** `/friends` — заявки/принятие, профиль друга со стоимостью полки
- **Логин** — email+пароль (Supabase Auth)
- **Фото** ~4 700 (топ-популярные) со страниц Parfumo
- **Цены — фаза 1**: оценка по тиру бренда × концентрации на все 59k (флаг `priceEstimated`, метка «est.»)
- **🫂 СОЦ-СЕТЬ (2026-07-12)**: **посты-впечатления** (рейтинг 1–10 + текст) — модели `Post`/`PostLike`. Лента `/feed` (единый таймлайн: посты друзей + активность коллекция/вишлист). **Шаримая страница поста `/p/[id]` с OG/Twitter-картой** (разворачивается ссылкой в соцсетях). Композер + отзывы на карточке аромата. Лайки (оптимистичные). «Feed» в хедере.
- **Новинки (кураторские)**: +заметные реальные релизы 2023–2025 через `prisma/seed-new.mjs` (без фото, est.-цена).

## 🔜 Что дальше (приоритет сверху)
1. **🔐 Google OAuth** — код готов (кнопка + callback), нужен ТОЛЬКО конфиг: Google Cloud OAuth client + включить провайдер Google в Supabase (Authentication → Providers). Задача пользователя (клики в дашбордах).
2. **📸 Фото + новинки 2025-26 (ЗАБЛОКИРОВАНО)** — Parfumo сейчас жёстко банит IP (403 «Just a moment») и на страницах ароматов, и на гридах, и на поиске. Сбрасывается за несколько дней. Нужен **Playwright** (headless обходит Cloudflare) ИЛИ подождать сброса и снова гнать `scrape-images.mjs`/`scrape-new.mjs`. Фото сейчас ~4 700.
3. **💰 Цены фаза 2** — реальные цены поверх оценок для популярных.
4. **⚔️ Битва полок** — сравнение «ты vs друг» (общие/чего нет/у кого дороже).
5. **🎮 Квизы** — «угадай парфюм» и др. (см. IDEAS.md).
6. **✨ Полиш** — баги, мобилка/адаптив.

## ⚙️ Тех-заметки (важно для продолжения)
- **Секреты** в `/.env` (в .gitignore, НЕ в репо): DATABASE_URL (транзакц. пул :6543 ?pgbouncer=true), DIRECT_URL (session pool :5432), NEXT_PUBLIC_SUPABASE_URL/ANON_KEY. Те же ключи заведены в Vercel env.
- **Build gotcha (НЕ ломать):** `"build": "prisma generate && next build"` + postinstall — иначе Vercel падает на устаревшем Prisma-клиенте.
- **psql:** `/opt/homebrew/opt/libpq/bin` (быстрый COPY-импорт). Node 26 через brew.
- **Датасет** каталога: Parfumo tidytuesday 2024-12-10 (`parfumo_data_clean.csv`) — снимок на дек.2024, качать в scratchpad с raw.githubusercontent при надобности. **Нет ароматов 2025-26** (кроме ~215 доскрейпленных).
- **Скрипты** (`prisma/`): `gen-copy.mjs` + `estimate-prices.sql` (цены), `scrape-images.mjs` (фото по href-match, устойчив к rate-limit + валидация имени файла), `scrape-new.mjs` (новинки, объединение сортировок т.к. `current_page` на JS), `seed.mjs` (49 кураторских с реальными ценами).
- **Parfumo анти-бот:** периодически Cloudflare (403 «Just a moment») при наплыве — скрейперы медленные, с авто-стопом. Картинки хотлинкятся с media.parfumo.com (не скачаны к себе).

## Схема данных (Prisma)
User (+favoriteNotes), Brand, Fragrance (+retailPrice/retailVolume/priceEstimated/imageUrl/notes*), CollectionItem (+quantity/remainingPct), WishlistItem, Friendship (PENDING/ACCEPTED), **Post** (rating/body → user+fragrance), **PostLike** (unique user+post).
