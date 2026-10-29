# Deploy Medical Aid to production (go-live)

**Live:** https://medical-aid-automation.vercel.app  
**Repo `main` is complete.** If the live site is behind, this doc is the only remaining work.

## How to tell production is stale

| Check | Stale (bad) | Fresh (good) |
|-------|-------------|--------------|
| Home | No **2027** banner | Banner: renew before **10 Dec 2026** |
| `/org/demo` | **404** | **200** |
| `/demo` | **307** → `/?next=/demo` | **200** |

As of the last platform check: production was **stale** while GitHub `main` already had demo + 2027 + 6-step ops.

## Fix in 5 minutes (Vercel Dashboard) — recommended

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) → project **medical-aid-automation**.
2. **Settings → Git**
   - Connected repo: `ArmaniousESP/medical-aid-automation` **or** `medshub/medical-aid-automation`
   - Production branch: **`main`**
   - If disconnected: **Connect Git Repository** and select the correct repo.
3. **Deployments** tab → **Create Deployment** (or **Redeploy**)
   - Branch / commit: **`main`** (latest)
   - Environment: **Production**
4. Wait until status is **Ready**.
5. Hard-refresh the site (or open an incognito window) and run the smoke table above.

## Fix via GitHub Actions (CLI deploy)

Workflow: `.github/workflows/deploy-vercel.yml`  
**It now fails** if secrets are missing (no silent skip).

### 1. Create a Vercel token
https://vercel.com/account/tokens → create → copy token.

### 2. Get org + project IDs
On a machine with Node:

```bash
npm i -g vercel
vercel login
cd /path/to/medical-aid-automation
vercel link   # select the production project
cat .vercel/project.json
# → orgId, projectId
```

### 3. GitHub → repo → Settings → Secrets and variables → Actions

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | token from step 1 |
| `VERCEL_ORG_ID` | `orgId` from project.json |
| `VERCEL_PROJECT_ID` | `projectId` from project.json |
| `VERCEL_APP_URL` | optional: `https://medical-aid-automation.vercel.app` |

### 4. Run the workflow
**Actions → Deploy Vercel → Run workflow** (branch `main`).

Expect: Checkout → Build → Deploy → Health **not** skipped.

## After deploy — confirm

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/org/demo
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/demo
curl -sS https://medical-aid-automation.vercel.app/api/health
```

Home HTML should contain `2027`. Health should have `"ok":true`.

## Share while production catches up

These routes already respond **200** on the current host (older UI is fine for a walkthrough):

- https://medical-aid-automation.vercel.app/guide
- https://medical-aid-automation.vercel.app/status
- https://medical-aid-automation.vercel.app/intake
- https://medical-aid-automation.vercel.app/me

Paste-ready text: `docs/SHARE_COPY.md`
