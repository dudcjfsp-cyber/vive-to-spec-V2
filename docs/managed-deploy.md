# Managed Mode Deployment

This document prepares the managed backend so that deployment day only requires setting secrets and verifying the live URL.

## What Is Already Ready
- The managed API server lives at `server/managedApiServer.js`.
- The server now binds to `0.0.0.0` and prefers `PORT`, which matches Render's runtime contract.
- Health check endpoint: `/api/health`
- Render blueprint file: `render.yaml`

## Secrets To Prepare
Set these on the Render service, not in the repository.

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `MANAGED_API_ALLOWED_ORIGIN`

Notes:
- Use only the providers you actually plan to expose.
- If you will only use Gemini during the education session, set only `GEMINI_API_KEY` and keep the others empty.
- `MANAGED_API_ALLOWED_ORIGIN` should be the exact frontend origin, for example `https://dudcjfsp-cyber.github.io`.

## Render Setup
1. Create a new Web Service from this repository.
2. Let Render detect `render.yaml`.
3. Keep the service on the `free` plan for the education period.
4. Add the secrets listed above.
5. Deploy once and confirm `/api/health` returns `ok: true`.

## Frontend Switch For Managed Mode
The managed frontend build needs these values:

- `VITE_APP_MODE=managed`
- `VITE_MANAGED_API_BASE_URL=https://<managed-api-host>/api`

Important:
- `VITE_` variables are public to the browser.
- Never place model API keys in any `VITE_` variable.

## Education Week Checklist
3 to 7 days before:
- Create the Render service.
- Add the real provider secret.
- Run one deploy.
- Verify `GET /api/health`.
- Verify one real transmute call from a local managed build.

1 day before:
- Deploy the final managed frontend build with the real API base URL.
- Update `MANAGED_API_ALLOWED_ORIGIN` if the frontend URL changed.
- Run one live end-to-end test.
- Warm the Render free instance once so the first classroom request is not the cold start.

After the session:
- Disable or delete the Render service.
- Rotate any API keys that were used for the session if the access scope was broad.

## Known Limits
- Render free can sleep after idle time.
- First request after sleep can be slow.
- This setup is for short education/demo usage, not long-term public production.
