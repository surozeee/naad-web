# Horoscope Content Management — Reference

Full product rules for Naad horoscope admin + APIs. Agents should prefer [SKILL.md](SKILL.md) for day-to-day work; use this for CSV columns, ratings, statuses, and target APIs.

## Multilingual

- ISO / LanguageEnum codes from **active** master languages only (`list-active`).
- Translations share: zodiac, type, startDate, endDate (content group).
- Base language (default or EN) → `horoscope` row; others → `horoscope_language`.

Example group key: `HORO-{yyyyMMdd}-{ZODIAC}-{D|W|M|Y}`.

## Ratings

Range `0.0`–`5.0`, increment `0.5`.

```java
public static boolean isValidRating(BigDecimal rating) {
    if (rating == null) return true;
    return rating.compareTo(BigDecimal.ZERO) >= 0
            && rating.compareTo(new BigDecimal("5.0")) <= 0
            && rating.multiply(new BigDecimal("2")).stripTrailingZeros().scale() <= 0;
}
```

Categories: overall, love, career, finance (`money`), health (required for publish when product rules demand); luck, energy, family, education, travel optional.

## Publication statuses

`DRAFT` | `SCHEDULED` | `PUBLISHED` | `UNPUBLISHED` | `ARCHIVED`

## CSV headers (target)

```text
external_id,content_group_id,zodiac_sign,horoscope_type,language_code,start_date,end_date,time_zone,title,overview,love_content,career_content,finance_content,health_content,family_content,education_content,travel_content,opportunities,challenges,guidance,lucky_color,lucky_number,lucky_time,compatible_zodiac,best_day,challenging_day,favorable_dates,favorable_months,important_dates,overall_rating,love_rating,career_rating,finance_rating,health_rating,luck_rating,energy_rating,family_rating,education_rating,travel_rating,status
```

Multi-value fields use `|` (e.g. dates/months).

Duplicate key: `zodiac_sign + horoscope_type + language_code + start_date + end_date` (or `external_id`).

Strategies: `SKIP_EXISTING` | `UPDATE_EXISTING` (default) | `CREATE_NEW_VERSION` | `FAIL_ON_DUPLICATE`.

Import flow: template → upload → parse → validate → preview → confirm → summary + error CSV.

## Target admin APIs

```http
POST/PUT/GET/DELETE /api/v2/event/horoscope/*
PATCH  /api/v2/event/horoscope/change-publish-status
POST   /api/v2/event/horoscope/import-csv
```

Extend toward validate/import-token/error-download when implementing full CSV preview.

## Public / mobile read

```http
GET ...?zodiac=ARIES&type=DAILY&language=ne&date=2026-07-13
```

Fallback: requested → app default language → EN. Response should indicate `fallbackUsed`.

## Permissions (recommended)

`HOROSCOPE_VIEW|CREATE|UPDATE|DELETE|PUBLISH|UNPUBLISH|ARCHIVE|TRANSLATE|CSV_UPLOAD|CSV_EXPORT|IMPORT_HISTORY_VIEW`

## Legacy schema

Drop `period_id`, `color`, `expense`, `prediction` when present; content columns nullable. Startup: `HoroscopeSchemaMigration`.
