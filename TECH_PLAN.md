# Технический план

## Принципы

- Всё через **GitHub** — любой шаг откатываем, работаем через ветки + PR.
- **Один язык** (TypeScript) на фронт, бэк и скрейпер — меньше переключений.
- **Типобезопасность** сквозная: Prisma-схема → типы БД → API → UI.
- Начинаем с ядра **каталог + коллекция**; ценовой слой (самое рискованное) — отдельной фазой.

## Стек

| Слой | Технология | Обоснование |
|---|---|---|
| Веб (фронт + API) | **Next.js 15 (App Router) + TypeScript** | Единый проект, серверные компоненты, лёгкий деплой |
| UI | **Tailwind CSS + shadcn/ui** | Быстрый качественный UI; «полка» должна выглядеть сочно |
| БД | **PostgreSQL** через **Supabase** | Managed Postgres + Auth + Storage картинок |
| ORM / миграции | **Prisma** | Типобезопасная схема, версионируемые миграции |
| Авторизация | **Supabase Auth** | Email + Google из коробки |
| Скрейпер | **Отдельный Node-воркер** (Playwright / Cheerio) | Изолирован, пишет в ту же БД, крутится по расписанию |
| Хостинг | **Vercel** (web) + **Supabase** (БД) | Автодеплой на каждый push, бесплатно на старте |
| Аналитика | Plausible / PostHog (позже) | Метрики продукта |

Мобильное приложение (Expo / React Native) — отдельная фаза, после веб-MVP.

## Архитектура (высокий уровень)

```
[ Браузер ] ── Next.js (SSR + API routes) ── Prisma ── PostgreSQL (Supabase)
                                                          ▲
                          [ Скрейпер-воркер ] ───────────┘
                          (каталог ароматов, позже — цены)
```

## Модель данных (ядро, Фаза 1)

- **User** — id, handle, email, avatar, createdAt.
- **Brand** — id, name, country, slug.
- **Fragrance** — id, name, brandId, house, releaseYear, concentration (EDT/EDP/…),
  notes (top/heart/base), imageUrl, externalIds (источники), slug.
- **CollectionItem** — userId, fragranceId, type (bottle/decant/sample), volumeMl,
  remainingPct, purchasePrice, purchaseDate, batchCode, isPublic, notes.
- **WishlistItem** — userId, fragranceId, targetPrice.

## Модель данных (Фаза 2+, ценовой слой и соц-граф)

- **PriceQuote** — fragranceId, retailer, priceUsd, pricePerMl, url, capturedAt.
- **WearLog** — collectionItemId, wornAt (для cost-per-wear).
- **Follow** — followerId, followeeId (соц-граф).

## Скрейпинг: правила безопасности

- Уважаем `robots.txt` и ToS; низкий rate-limit, кэш, никакой нагрузки на источник.
- Каталог заливаем **инкрементально**, а не «всё за раз».
- Там, где есть **аффилиатные фиды** — предпочитаем их сырому скрейпу.
- Если юр-риск/блокировки → fallback на сид-набор топ-ароматов.

## Окружения

- **local** — Next.js dev + Supabase (облачный dev-проект или локальный).
- **prod** — Vercel + Supabase prod. Секреты в env, не в гите.

## Git-флоу

- `main` — всегда деплоится.
- Фичи в ветках `feat/…`, багфиксы `fix/…`, PR в `main`.
- Коммиты атомарные, сообщения по существу.
