# Next steps — Medical Aid

## 0. Unblock production (do this first)

Live site is often **behind** GitHub `main`. Full instructions: **`docs/DEPLOY.md`**.

**Quick path:** Vercel → project **medical-aid-automation** → **Deployments** → deploy **`main`** to **Production**.

**Confirm:**

```text
https://medical-aid-automation.vercel.app/     → 2027 banner visible
https://medical-aid-automation.vercel.app/org/demo → 200
https://medical-aid-automation.vercel.app/api/health → ok: true
```

Until then, walk stakeholders through:  
https://medical-aid-automation.vercel.app/guide

---

## 1. Staff access

| Method | Env |
|--------|-----|
| Secret unlock | `PROCESS_SECRET` (already used in production) |
| Google staff | `NEON_AUTH_BASE_URL` + `OPS_ALLOWED_EMAILS` + cookie secret — `docs/NEON_AUTH.md` |

Open Home → **Staff unlock** (or `/admin`).

---

## 2. Monthly ops path (every cycle)

1. **Queue** `/intake-ops` — Process waiting requests  
2. **Claims** `/claims` — Review drafts → Submit  
3. **Pharmacy** `/pharmacy` — Period lists / CSV  
4. **EVA split** `/eva-split` — Warehouse vs external CSV  
5. **Programs** `/programs` — Enrollments / care line  
6. **Refills** `/refills` — Monthly cycles  

Safety / DDInter: `/refills/safety` when needed.

---

## 3. Beneficiaries (communicate)

| Action | Link |
|--------|------|
| Submit | `/intake` |
| Status | `/request-status` |
| Profile + **2027 renew** (before **10 Dec 2026**) | `/me` |
| How-to | `/guide` |

Paste-ready WhatsApp / email / HR: **`docs/SHARE_COPY.md`**  
Live demo script: **`docs/DEMO.md`**

---

## 4. Optional (when ready)

| Feature | Action |
|---------|--------|
| Other employers | `/org/register` + Admin approve |
| WhatsApp live | Meta or Twilio env — keep dry-run until tested |
| WHO assessment / AI coach | Set flags only after management approval |
| DHIS2 | Optional HMIS — `docs/dhis2.md` |
| Staging | `docs/STAGING.md` |
| Auto CLI deploy | GitHub secrets `VERCEL_TOKEN` + org/project IDs |

---

## 5. Done when

- [ ] Production shows 2027 banner + `/org/demo` 200  
- [ ] Staff can unlock and run Queue → … → Refills  
- [ ] HR/employees have guide + `/me` renew message  
- [ ] Optional channels (WhatsApp, Google staff) configured or consciously deferred  
