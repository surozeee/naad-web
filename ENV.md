# Environment variables

## NextAuth session (erp-web auth flow)

Tokens live in an **HttpOnly** NextAuth JWT cookie (`next-auth.session-token`). Do not store access/refresh tokens in `localStorage`.

```env
NEXTAUTH_SECRET=replace-with-a-long-random-secret-min-32-chars
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_XSRF_TOKEN=…
BACKEND_URL=https://api-naad.jojolapatech.com
```

Login uses `POST /api/auth/login` (sets session cookies). Authenticated calls use `fetchWithAuth` / `authFetch`.

## Fix "XSRF Token Missing" (403 on user/role/permission pages)

The app sends the XSRF token as the **`X-XSRF-TOKEN`** header on every API request. Set the token in `.env` using either variable name:

1. **Create `.env`** in the project root (if you don’t have one).
2. **Add the XSRF token** (same value you use in Swagger/Postman for `X-XSRF-TOKEN`):

   ```env
   NEXTAUTH_XSRF_TOKEN=BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=
   ```

   Or with the alternate name:

   ```env
   NEXT_AUTH_XSRF_TOKEN=BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=
   ```

3. **Restart the server** (`npm run dev` or `npm run start`).

If you still get 403, your gateway may use a different token — get the correct encrypted value from your backend team and set one of the variables above to that value.
