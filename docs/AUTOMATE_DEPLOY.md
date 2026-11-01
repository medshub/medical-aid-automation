# Automate deployment to Vercel

Goal: **every push to `main` updates** https://medical-aid-automation.vercel.app automatically.

You only need **one** of the two methods below.

---

## Method A — Vercel Git integration (simplest)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project **medical-aid-automation**.
2. **Settings → Git**
   - Connect GitHub repo: `ArmaniousESP/medical-aid-automation` or `medshub/medical-aid-automation`
   - Production branch: **`main`**
3. **Settings → Git → Deploy Hooks** (optional) if you need a URL to force deploy.
4. Push any commit to `main` — Vercel builds Production automatically.

**Verify:** Deployments tab shows the latest `main` SHA as **Ready** on Production.

---

## Method B — GitHub Actions CLI deploy (works even if Git link is broken)

Workflow already in repo: `.github/workflows/deploy-vercel.yml`  
Triggers: **push to `main`** + **manual Run workflow**.

### One-time secrets (GitHub → repo → Settings → Secrets and variables → Actions)

| Secret | How to get it |
|--------|----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create |
| `VERCEL_ORG_ID` | See below |
| `VERCEL_PROJECT_ID` | See below |
| `VERCEL_APP_URL` | Optional: `https://medical-aid-automation.vercel.app` |

### Get ORG_ID and PROJECT_ID

```bash
npm i -g vercel
vercel login
cd medical-aid-automation   # local clone
vercel link                 # select the production project
cat .vercel/project.json
```

Example:

```json
{
  "orgId": "team_xxxxx",
  "projectId": "prj_xxxxx"
}
```

Paste those into GitHub secrets as `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.

### Run

- Push to `main`, or  
- **Actions → Deploy Vercel → Run workflow**

The job must show **Deploy to Vercel** + **Verify production** (not a secrets error).

---

## After automation works

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://medical-aid-automation.vercel.app/org/demo
# expect 200

curl -sS https://medical-aid-automation.vercel.app/ | grep -o 2027 | head -1
# expect 2027
```

---

## Why production was stale

The old workflow **skipped** deploy when secrets were missing and still reported success.  
Git integration was also not updating Production.  
The workflow now **fails loudly** until secrets are set; Method A or B fixes the lag.
