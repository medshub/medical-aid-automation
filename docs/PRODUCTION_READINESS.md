# Production readiness assessment

**Date:** 2026-10-28  
**App:** https://medical-aid-automation.vercel.app/

## Verdict

**Application on GitHub `main`: fulfilled** for core chronic medicine support (multi-org, audit, Aida UX, 6-step ops path, demo kit).

**Production URL gate:** if the live site is missing the 2027 banner or `/org/demo` is 404, Vercel is serving a **stale build**. Fix with **`docs/DEPLOY.md`** (Git link or `VERCEL_TOKEN` secrets). Until then, share **`/guide`** and **`/status`**.

**Staff monthly path:**  
**1 Queue → 2 Claims → 3 Pharmacy → 4 EVA split → 5 Programs → 6 Refills**

## Hardening completed

- [x] Claims / pharmacy org-scoped · rate limits · audit · org registration
- [x] Aida design · FlowSteps 1–6 · AppNav · mobile staff bar
- [x] Three-door identity · employee portal · status mask/share
- [x] Egyptian catalog · formulary · EVA split · estimate · drafts · 2027 renew
- [x] Demo pages (`/demo`, `/org/demo`) · `docs/DEMO.md` · `docs/SHARE_COPY.md` · `docs/DEPLOY.md`
- [x] Feature flags: WHO + AI coach **off** until management enables
- [x] Soft DHIS2 · optional WhatsApp

## Deploy gate (live fulfilled)

| Check | Expected |
|-------|----------|
| Home 2027 banner | Visible |
| `/org/demo` | HTTP 200 |
| `/demo` | HTTP 200 |
| `/api/health` | `ok: true` |

See **`docs/DEPLOY.md`**.

## Optional next (env — not code blockers)

- [ ] Neon Auth Google staff (`docs/NEON_AUTH.md`)
- [ ] `ORG_REGISTRATION_MODE=approval` when needed
- [ ] Staging (`docs/STAGING.md`)
- [ ] Live WhatsApp · `SMOKE_PROCESS_SECRET` for staff smoke
- [ ] Enable WHO / AI flags after management approval

## Share now

| | |
|--|--|
| Guide | https://medical-aid-automation.vercel.app/guide |
| Status | https://medical-aid-automation.vercel.app/status |
| Demo (after deploy) | https://medical-aid-automation.vercel.app/org/demo |
| Copy kit | `docs/SHARE_COPY.md` |
