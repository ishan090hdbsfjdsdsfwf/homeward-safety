# Homeward - frontend (React PWA)

Pairs with the Spring Boot backend in `safeway.zip`.

## Run
1. Start the backend on port 8080 (`mvn spring-boot:run`).
2. In this folder: `npm install` then `npm run dev`.
3. Open http://localhost:5173 (use Chrome's device toolbar to preview on a phone).

In dev, `/api` is proxied to `localhost:8080`. For production set `VITE_API_URL` to your backend URL,
set the backend `BASE_URL` to this app's URL (it is used in alert links), and add `CORS_ORIGINS`.

## Screens
- `/login` sign in / create account (with optional check-in PIN and silent alert PIN)
- `/` start a journey, then the countdown ring with "I've arrived" (PIN keypad), add 15 minutes, share link
- `/contacts` manage trusted contacts
- `/track/:token` public page for contacts: live map, status, last update

## Known limits (be honest about these in your README / interviews)
- A web app cannot send location with the screen locked. The app keeps the screen awake while a journey runs,
  and the server-side ETA timer is the real safety net.
- The active journey is remembered in localStorage. Add `GET /api/journeys/active` to the backend to restore it on a new device.
- Contacts poll every 10 seconds; WebSockets would make it instant.
- SPA hosting needs a fallback to index.html (Netlify `_redirects`: `/* /index.html 200`).
