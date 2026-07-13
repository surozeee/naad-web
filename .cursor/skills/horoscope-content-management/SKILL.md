---
name: horoscope-content-management
description: >-
  Implements and maintains Naad horoscope admin content (manual CRUD, multilingual
  locales, CSV import/validate/preview, 0.5-step ratings, publish lifecycle). Use when
  working on horoscope APIs, CSV upload, ratings, translations, publish/archive, or
  admin horoscope UI in naad-app / naad-official.
---

# Horoscope Content Management

## Scope

Backend: `naad-app` (`com.jojolapatech.naad.event` horoscope*).  
Frontend: `d:\frontend\naad-official` (`app/horoscope/*`, `app/lib/horoscope-multilang.ts`).

When implementing or changing horoscope features, follow this skill and [reference.md](reference.md).

## Hard rules

1. **Languages = active Language master list only**
   - Load via `GET /api/v2/master/language/list-active`.
   - Do **not** hardcode EN/NE/HI as the source of truth.
   - Reject locale / CSV `language_code` values that are not in the active list.
   - UI language tabs must be built only from that active list (boot fallback to DEFAULT is temporary until list loads).

2. **Required identity fields** (everything else optional unless noted):
   - `zodiacSign`, `horoscopeType`, `startDate`, `endDate`
   - Base language content on main row; other active languages as locale rows sharing the same period/zodiac/type.

3. **Types**: `DAILY` | `WEEKLY` | `MONTHLY` | `YEARLY`

4. **Zodiac**: `ARIES` … `PISCES` (12 signs)

5. **Ratings**: `BigDecimal` / number **0.0–5.0**, step **0.5** only. Null allowed for optional ratings.
   - Validate with half-step rule (`rating * 2` is integer).
   - Prefer dropdown of `0.0, 0.5, …, 5.0` in UI.

6. **Publish status**: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` (extend enum as needed; keep DB migration safe).

7. **Period rules**
   - `DAILY`: `startDate == endDate`
   - `WEEKLY` / others: `endDate >= startDate`

8. **CSV**: UTF-8, validate → preview → confirm import; duplicate strategies: `SKIP_EXISTING` | `UPDATE_EXISTING` (default) | `CREATE_NEW_VERSION` | `FAIL_ON_DUPLICATE`.

9. **Legacy DB**: On startup, drop/relax legacy NOT NULL columns (`period_id`, `color`, `prediction`, `expense`) via `HoroscopeSchemaMigration`. Do not reintroduce NOT NULL on content fields.

## Current data model (naad-app)

Prefer evolving existing tables until a full `horoscope_content` cutover:

| Table | Role |
|-------|------|
| `horoscope` | Base (usually default/EN) row: zodiac, type, dates, ratings, lucky_*, publish_status |
| `horoscope_language` | Translations for non-base active languages |

Target schema and full CSV/API surface: [reference.md](reference.md).

## Implementation checklist

When adding/changing features:

- [ ] Languages from `language/list-active` only
- [ ] Rating validation 0–5 / 0.5 step (API + UI)
- [ ] Period rules by horoscope type
- [ ] CSV template + validate + import summary with row errors
- [ ] Publish / unpublish / archive audited via existing audit fields
- [ ] Public/mobile read APIs support language fallback: requested → default → EN
- [ ] No regressions on legacy `period_id` / `color` NOT NULL

## Code touchpoints

- Entity/service: `event/entity/HoroscopeEntity.java`, `HoroscopeLanguageEntity.java`, `service/impl/HoroscopeCrudServiceImpl.java`
- Controller: `event/controller/HoroscopeController.java`
- Schema: `event/config/HoroscopeSchemaMigration.java`, `resources/db/horoscope_optional_postgres.sql`
- FE helpers: `app/lib/horoscope-multilang.ts`
- FE pages: `app/horoscope/add-csv/page.tsx`, `app/horoscope/manage/page.tsx`

## Do not

- Invent languages outside master active list
- Accept ratings like `3.2` / `4.7`
- Leave legacy NOT NULL columns that block inserts
- Put large product copy only in chat — update this skill / reference instead
