# Environment variables

## Fix "XSRF Token Missing" (403 on user/role/permission pages)

1. **Create `.env`** in the project root (if you don’t have one).
2. **Add the XSRF token** (same value you use in Swagger/Postman for `X-XSRF-TOKEN`):

   ```env
   NEXTAUTH_XSRF_TOKEN=BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=
   ```

   Or copy from `.env.example` (it contains this line).

3. **Restart the dev server** (stop and run `npm run dev` again).

If you still get 403, your gateway may use a different token — get the correct encrypted value from your backend team and set `NEXTAUTH_XSRF_TOKEN` to that.
