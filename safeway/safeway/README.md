# Safeway - journey check-in safety app (backend)

If a user does not check in by ETA + grace period, trusted contacts are alerted with a live tracking link.

## Run
1. `docker compose up -d`   (starts MySQL)
2. `mvn spring-boot:run`    (Java 17+, Maven)
3. Tables are created automatically (`ddl-auto: update`).

## Environment variables (all optional for local dev)
`JWT_SECRET`, `DB_URL`, `DB_USER`, `DB_PASSWORD`, `BASE_URL` (frontend URL used in alert links),
`TELEGRAM_BOT_TOKEN` (free alerts), `MAIL_HOST`/`MAIL_USER`/`MAIL_PASSWORD` (Gmail SMTP app password).

## API
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register | name, email, password, optional cancelPin / duressPin (4-6 digits) |
| POST | /api/auth/login | returns JWT |
| POST/GET/DELETE | /api/contacts | max 5; need email or telegramChatId |
| POST | /api/journeys | destination, etaMinutes, graceMinutes |
| POST | /api/journeys/{id}/ping | latitude, longitude, batteryPct |
| POST | /api/journeys/{id}/arrive | optional pin (cancel PIN = normal, duress PIN = silent alert) |
| PATCH | /api/journeys/{id}/extend | minutes |
| GET | /api/track/{token} | public, expiring link for contacts |

Send `Authorization: Bearer <token>` on all non-public endpoints.

## Design notes
- Overdue detection is DB-driven (`@Scheduled` every 30s), so it survives restarts.
- Alerts try each channel with 3 retries, then fall back to the next channel; every attempt is logged in `alerts`.
- New channels (SMS, WhatsApp) = implement `NotificationChannel`.
- Location pings are purged 24h after a journey ends.
- Not a replacement for emergency services (112 in India).

## TODO / next steps
- Reminder to the user at ETA before alerting contacts
- WebSocket live tracking (currently contacts poll `/api/track/{token}`)
- Rate limiting, integration tests (Testcontainers), Swagger, Dockerfile, CI
- Multi-instance safety for the scheduler (e.g. ShedLock)
