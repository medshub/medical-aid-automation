# Medical Aid Automation

**طلب مساعدة علاج شهري** — platform-native monthly chronic medicine support

System of record: **Neon** (not Google Sheets).  
Stack: **Next.js 14** · **Vercel** · **Neon PostgreSQL** · **GitHub**

| | |
|--|--|
| **Live** | https://medical-aid-automation.vercel.app |
| **Demo** | https://medical-aid-automation.vercel.app/demo |
| **Guide** | https://medical-aid-automation.vercel.app/guide |
| **Status** | https://medical-aid-automation.vercel.app/status |

Share copy (WhatsApp, email, LinkedIn, X): [`docs/SHARE_COPY.md`](docs/SHARE_COPY.md)  
Live walkthrough script: [`docs/DEMO.md`](docs/DEMO.md)

---

## Primary cycle

### Beneficiaries (public)

```
/intake            → submit request (estimate · draft · Request ID)
/request-status   → track · share · privacy mask
/me               → profile · 2027 renew (before 10 Dec 2026)
```

### Staff (unlock on Home)

```
1 /intake-ops   Queue     → process · match · enroll · claim drafts
2 /claims       Claims    → review · submit
3 /pharmacy     Pharmacy  → period CSV · batch
4 /eva-split    EVA       → warehouse vs external cut
5 /programs     Programs  → chronic enrollments
6 /refills      Refills   → monthly cycles · safety
```

| UI | Purpose |
|----|--------|
| `/demo` | Public showcase (5 min) |
| `/guide` | Full bilingual how-to |
| `/status` | Health & ops checklist |
| `/org/register` | Other employers join |

**Legacy:** Google Form → sheet → `/api/process` if `GOOGLE_*` is set; not required.

---

## Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** | Neon **pooler** connection |
| `PROCESS_SECRET` | Recommended | Unlock ops APIs |
| `AUTO_ENROLL_INTAKE` | Optional | Default **on** |
| `AUTO_CLAIM_ON_ENROLL` | Optional | Default **on** |
| `CLAIMS_WEBHOOK_URL` | Optional | External TPA push |
| `GOOGLE_*` + `GOOGLE_SHEET_ID` | Optional | Legacy sheet path only |
| `NEON_AUTH_*` + `OPS_ALLOWED_EMAILS` | Optional | Google staff sign-in |
| WhatsApp / DHIS2 vars | Optional | Outreach & HMIS |

---

## Key APIs

```bash
curl "$APP/api/health"

curl -X POST "$APP/api/process-intake" -H "Content-Type: application/json" \
  -H "x-process-secret: $SECRET" -d '{"dryRun":false}'
```

---

## Docs

- `docs/PRODUCTION_READINESS.md` — production checklist  
- `docs/DEMO.md` · `docs/SHARE_COPY.md` — demo & promotion  
- `docs/NEON_AUTH.md` · `docs/STAGING.md`  
- `docs/schema/` — Neon schema  

---

## Local

```bash
npm install
cp .env.example .env.local   # DATABASE_URL minimum
npm run dev
```

Private – internal / multi-org use.
