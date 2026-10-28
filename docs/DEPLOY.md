# Deploy Medical Aid to production

Live site: https://medical-aid-automation.vercel.app

## Symptom of a stale production build

- `/demo` redirects to `/?next=/demo`
- `/org/demo` returns **404** even though the route exists on `main`
- Home is missing the **2027 renewal banner** and **See the demo** button

GitHub `main` can be ahead while Vercel still serves an older deployment.

## Preferred: Vercel ↔ GitHub integration

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project **medical-aid-automation**.
2. **Settings → Git** — repository must be `ArmaniousESP/medical-aid-automation` (or `medshub/medical-aid-automation` if that is the linked remote), branch **main**.
3. **Deployments** → confirm the latest commit SHA matches GitHub `main`.
4. If the latest commit is missing: **Deployments → Redeploy** the newest production deployment, or **Create Deployment** from `main`.

## Force CLI deploy (GitHub Actions)

Repo workflow: `.github/workflows/deploy-vercel.yml`

Add **repository secrets**:

| Secret | Where to get it |
|--------|------------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | same file |
| `VERCEL_APP_URL` | optional, default `https://medical-aid-automation.vercel.app` |

Then:

```bash
# empty commit to trigger, or
gh workflow run "Deploy Vercel"
```

Without these secrets the Action reports **success** but **skips** the CLI deploy (it only prints a notice). Rely on Git integration or add the secrets.

## After a good deploy — smoke checklist

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/org/demo
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/demo
curl -sS https://medical-aid-automation.vercel.app/api/health | head -c 200
```

Expect: `/` **200**, `/org/demo` **200**, `/demo` **200** (or 307→`/org/demo` if you add a redirect), health `"ok":true`.

## Share while waiting

Until production catches up, use pages that already work on the live host:

- Guide: https://medical-aid-automation.vercel.app/guide
- Status: https://medical-aid-automation.vercel.app/status
- Intake: https://medical-aid-automation.vercel.app/intake
