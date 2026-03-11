# Managed Mode Deployment

This document prepares the managed backend so that deployment day only requires setting secrets and verifying the live URL.

## What Is Already Ready
- The managed API local dev server lives at `server/managedApiServer.js`.
- The Vercel production functions live under `api/`.
- Health check endpoint: `/api/health`
- Vercel route configuration is currently kept inline in `api/*.js` via route-local `maxDuration` exports.

## Deployment Split
- GitHub Pages and Vercel should be treated as separate deployment targets.
- Do not change the GitHub Pages build variables if you want to preserve the current Pages deployment behavior.
- `vite.config.js` now branches the asset base automatically:
- GitHub Pages build uses `/vive-to-spec-V2/`
- Vercel build uses `/`
- You can override this explicitly with `VITE_DEPLOY_TARGET=pages` or `VITE_DEPLOY_TARGET=vercel`.

## Secrets To Prepare
Set these in the Vercel project, not in the repository.

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `MANAGED_API_ALLOWED_ORIGIN`

Notes:
- Use only the providers you actually plan to expose.
- If you will only use Gemini during the education session, set only `GEMINI_API_KEY` and keep the others empty.
- `MANAGED_API_ALLOWED_ORIGIN` should be the exact frontend origin, for example `https://dudcjfsp-cyber.github.io`.
- If you need GitHub Pages production plus Vercel preview testing, you can provide multiple origins as a comma-separated list.

## GitHub Pages
- Existing GitHub Pages workflow can remain unchanged.
- If Pages should keep the current static/demo behavior, do not set managed-only `VITE_*` values in the Pages workflow.
- If you later want a managed Pages build too, create a separate Pages workflow or environment-specific build step instead of reusing the same variables.

## Vercel Setup
1. Import this repository as a Vercel project.
2. Keep the framework preset simple because the managed API is served from Vercel and the frontend can also build correctly there.
3. Add the secrets listed above.
4. If you deploy the frontend on Vercel too, set `VITE_DEPLOY_TARGET=vercel` explicitly for clarity.
5. Deploy once and confirm `/api/health` returns `ok: true`.
6. Confirm `api/transmute` completes within the configured function duration.

## Frontend Switch For Managed Mode
The managed frontend build needs these values:

- `VITE_APP_MODE=managed`
- `VITE_MANAGED_API_BASE_URL=https://<managed-api-host>.vercel.app/api`

Important:
- `VITE_` variables are public to the browser.
- Never place model API keys in any `VITE_` variable.
- For a Vercel-hosted frontend using the same project API, you can also keep `VITE_MANAGED_API_BASE_URL` unset and use the default `/api` base.
- For GitHub Pages, setting `VITE_MANAGED_API_BASE_URL` changes that Pages build, so treat it as a separate deployment environment.

## Education Week Checklist
3 to 7 days before:
- Create the Vercel project.
- Add the real provider secret.
- Run one deployment.
- Verify `GET /api/health`.
- Verify one real transmute call from a local managed build.

1 day before:
- Deploy the final managed frontend build with the real API base URL only on the target that should use managed mode.
- Update `MANAGED_API_ALLOWED_ORIGIN` if the frontend URL changed.
- Run one live end-to-end test.
- Warm the Vercel function once so the first classroom request is not the first cold start.

After the session:
- Disable or delete the Vercel project if it is no longer needed.
- Rotate any API keys that were used for the session if the access scope was broad.

## Known Limits
- Serverless execution time is bounded, so long-running model calls must fit within the configured duration.
- Cold starts are still possible, though generally shorter than a sleeping free Render web service.
- This setup is for short education/demo usage, not long-term public production.

